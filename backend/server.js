const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const twilio = require('twilio'); // Import Twilio
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Twilio Credentials (move to environment variables in production!)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
const TWILIO_PHONE_NUMBER_PREFIX = process.env.TWILIO_PHONE_NUMBER_PREFIX || '+91'; // Assuming Indian phone numbers for hospitals

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.use(cors());
app.use(express.json());

let db;

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"}); // Changed model to gemini-1.5-flash

// Connect to MongoDB
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db('blooddoc');
    // Create 2dsphere index for geospatial queries on hospitals collection
    db.collection('hospitals').createIndex({ location: '2dsphere' })
      .then(() => console.log('Geospatial index created on hospitals.location'))
      .catch(err => console.error('Error creating geospatial index:', err));
  })
  .catch(error => console.error('MongoDB connection error:', error));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Authentication: No token provided.');
    return res.status(401).json({ message: 'Access token required' });
  }

  console.log('Authentication: Token received, verifying...');
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Authentication: Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log('Login attempt for:', { email, role });
    let user = null;
    if (role === 'patient') {
      user = await db.collection('patients').findOne({ email });
    } else if (role === 'hospital') {
      user = await db.collection('hospitalUsers').findOne({ email }); // Authenticate against hospitalUsers
    }
    console.log('User found for login:', user);

    if (user && await bcrypt.compare(password, user.password)) {
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      
      // Convert ObjectId to string for JWT payload
      userWithoutPassword.id = userWithoutPassword._id.toString();
      delete userWithoutPassword._id; // Remove the ObjectId before signing

      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '24h' });
      
      const responseData = {
        user: userWithoutPassword, // This user will have `id` as string
        token
      };
      
      res.json(responseData);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, address, phone, city } = req.body;

    console.log('Registration attempt with:', { email, name, role });
    // Validate required fields
    if (!email || !password || !name || !role || (role === 'hospital' && !city)) {
      console.log('Missing required fields for registration');
      return res.status(400).json({ message: 'All required fields must be provided, including city for hospitals.' });
    }

    let collection;
    let existingUser;

    if (role === 'patient') {
      collection = db.collection('patients');
      existingUser = await collection.findOne({ email });
    } else if (role === 'hospital') {
      collection = db.collection('hospitalUsers'); // New collection for hospital users
      existingUser = await collection.findOne({ email });
    } else {
      console.log('Invalid role provided during registration:', role);
      return res.status(400).json({ message: 'Invalid role' });
    }

    console.log('Existing user check:', existingUser);
    if (existingUser) {
      console.log('User with this email and role already exists');
      return res.status(409).json({ message: `User with this email and role (${role}) already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds = 10
    console.log('Password hashed successfully');

    // Create new user object for authentication
    const authUser = {
      email,
      password: hashedPassword,
      name,
      role,
    };
    console.log('New auth user object created:', authUser);

    const authResult = await collection.insertOne(authUser);
    console.log('Auth user MongoDB insert result:', authResult);
    const createdAuthUser = { ...authUser, _id: authResult.insertedId };

    let userWithoutPassword = { ...createdAuthUser };
    delete userWithoutPassword.password;
    userWithoutPassword.id = userWithoutPassword._id.toString();
    delete userWithoutPassword._id;

    // If it's a hospital, create a separate hospital profile
    if (role === 'hospital') {
      let hospitalLocation = null;
      if (city) {
        // Placeholder for geocoding API call
        // In a real application, you would call a geocoding service here
        // Example: const geoData = await someGeocodingService.getCoordinates(city);
        // For now, let's use a hardcoded value for testing or a simple lookup
        const cityCoordinates = {
          'Chennai': [80.2707, 13.0827], // Longitude, Latitude
          'Bengaluru': [77.5946, 12.9716],
          'Mumbai': [72.8777, 19.0760],
          'Delhi': [77.2167, 28.6448],
          'Hyderabad': [78.4867, 17.3850],
          // Add more cities as needed
        };
        console.log(`Attempting to geocode city: ${city}`);
        const coords = cityCoordinates[city];
        if (coords) {
          hospitalLocation = { type: 'Point', coordinates: coords };
          console.log(`Geocoded ${city} to:`, hospitalLocation);
        } else {
          console.log(`City ${city} not found in hardcoded coordinates.`);
        }
      }
      const newHospitalProfile = {
        name,
        address: address || null,
        phone: phone || null,
        email,
        // Store location as GeoJSON Point if lat/lng are provided
        location: hospitalLocation, // Use geocoded location
        bloodInventory: [],
        beds: [],
        staff: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userWithoutPassword.id // Link to the newly created hospital user's ID
      };
      console.log('New hospital profile object created:', newHospitalProfile);
      const hospitalResult = await db.collection('hospitals').insertOne(newHospitalProfile);
      console.log('Hospital profile MongoDB insert result:', hospitalResult);
      // The user object returned in the token should still be the auth user, not the hospital profile
    }

    // Generate JWT token for the authenticated user
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      user: userWithoutPassword, // This user will have `id` as string
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Hospital Route
app.post('/api/hospitals', authenticateToken, async (req, res) => {
  try {
    // Ensure only hospital roles can create hospitals (or an admin)
    if (req.user.role !== 'hospital' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only hospitals or admins can create hospital entries.' });
    }

    const { name, address, phone, email, location, city } = req.body; // Added city

    if (!name || !address || !phone || !email || !city) { // city is now mandatory
      return res.status(400).json({ message: 'Name, address, phone, email, and city are required for hospital creation.' });
    }

    let hospitalLocation = null;
    if (city) {
      // Placeholder for geocoding API call
      const cityCoordinates = {
        'Chennai': [80.2707, 13.0827], // Longitude, Latitude
        'Bengaluru': [77.5946, 12.9716],
        'Mumbai': [72.8777, 19.0760],
        'Delhi': [77.2167, 28.6448],
        'Hyderabad': [78.4867, 17.3850],
      };
      console.log(`Attempting to geocode city: ${city}`);
      const coords = cityCoordinates[city];
      if (coords) {
        hospitalLocation = { type: 'Point', coordinates: coords };
        console.log(`Geocoded ${city} to:`, hospitalLocation);
      } else {
        console.log(`City ${city} not found in hardcoded coordinates.`);
      }
    }
    const newHospital = {
      name,
      address,
      phone,
      email,
      // Store location as GeoJSON Point if provided in the body
      location: hospitalLocation, // Use geocoded location
      bloodInventory: [],
      beds: [],
      staff: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id // Associate hospital with the user who created it
    };

    const result = await db.collection('hospitals').insertOne(newHospital);
    const createdHospital = { ...newHospital, _id: result.insertedId };

    res.status(201).json(createdHospital);

  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add/Update Blood Inventory for a Hospital
app.post('/api/hospitals/:hospitalId/blood-inventory', authenticateToken, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { bloodType, units, expiryDate } = req.body;

    if (!hospitalId) {
      return res.status(400).json({ message: 'Hospital ID is required.' });
    }
    if (!bloodType || typeof units === 'undefined') {
      return res.status(400).json({ message: 'Blood type and units are required.' });
    }
    if (typeof units !== 'number' || units < 0) {
      return res.status(400).json({ message: 'Units must be a non-negative number.' });
    }

    const hospitalObjectId = new ObjectId(hospitalId);
    const hospital = await db.collection('hospitals').findOne({ _id: hospitalObjectId });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    // Authorization: Only the hospital itself or an admin can update its inventory
    if (req.user.role !== 'admin' && req.user.id !== hospital.userId) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own hospital\'s blood inventory.' });
    }

    let updatedBloodInventory = [...hospital.bloodInventory || []];
    const existingBloodTypeIndex = updatedBloodInventory.findIndex(item => item.bloodType === bloodType);
    const now = new Date().toISOString();

    if (existingBloodTypeIndex > -1) {
      // Update existing blood type
      updatedBloodInventory[existingBloodTypeIndex] = {
        ...updatedBloodInventory[existingBloodTypeIndex],
        units,
        expiryDate: expiryDate || updatedBloodInventory[existingBloodTypeIndex].expiryDate,
        lastUpdated: now
      };
    } else {
      // Add new blood type
      updatedBloodInventory.push({
        id: new ObjectId().toString(),
        bloodType,
        units,
        expiryDate: expiryDate || null,
        lastUpdated: now
      });
    }

    const updateDoc = {
      $set: {
        bloodInventory: updatedBloodInventory,
        updatedAt: now
      }
    };

    await db.collection('hospitals').updateOne({ _id: hospitalObjectId }, updateDoc);

    const updatedHospital = await db.collection('hospitals').findOne({ _id: hospitalObjectId });
    res.status(200).json(updatedHospital.bloodInventory);

  } catch (error) {
    console.error('Error adding/updating blood inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a specific blood inventory entry for a Hospital
app.put('/api/hospitals/:hospitalId/blood-inventory/:bloodInventoryId', authenticateToken, async (req, res) => {
  try {
    const { hospitalId, bloodInventoryId } = req.params;
    const { units, expiryDate } = req.body;

    if (!hospitalId || !bloodInventoryId) {
      return res.status(400).json({ message: 'Hospital ID and Blood Inventory ID are required.' });
    }
    if (typeof units === 'undefined' && typeof expiryDate === 'undefined') {
      return res.status(400).json({ message: 'At least units or expiryDate must be provided for update.' });
    }
    if (typeof units !== 'number' && typeof units !== 'undefined' || (typeof units === 'number' && units < 0)) {
      return res.status(400).json({ message: 'Units must be a non-negative number if provided.' });
    }

    const hospitalObjectId = new ObjectId(hospitalId);
    const hospital = await db.collection('hospitals').findOne({ _id: hospitalObjectId });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    // Authorization: Only the hospital itself or an admin can update its inventory
    if (req.user.role !== 'admin' && req.user.id !== hospital.userId) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own hospital\'s blood inventory.' });
    }

    let updatedBloodInventory = [...hospital.bloodInventory || []];
    const existingBloodTypeIndex = updatedBloodInventory.findIndex(item => item.id === bloodInventoryId);

    if (existingBloodTypeIndex === -1) {
      return res.status(404).json({ message: 'Blood inventory entry not found.' });
    }

    // Update specific fields
    if (typeof units !== 'undefined') {
      updatedBloodInventory[existingBloodTypeIndex].units = units;
    }
    if (typeof expiryDate !== 'undefined') {
      updatedBloodInventory[existingBloodTypeIndex].expiryDate = expiryDate;
    }
    updatedBloodInventory[existingBloodTypeIndex].lastUpdated = new Date().toISOString();

    const updateDoc = {
      $set: {
        bloodInventory: updatedBloodInventory,
        updatedAt: new Date().toISOString()
      }
    };

    await db.collection('hospitals').updateOne({ _id: hospitalObjectId }, updateDoc);

    const updatedHospital = await db.collection('hospitals').findOne({ _id: hospitalObjectId });
    res.status(200).json(updatedHospital.bloodInventory);

  } catch (error) {
    console.error('Error updating blood inventory entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a specific blood inventory entry for a Hospital
app.delete('/api/hospitals/:hospitalId/blood-inventory/:bloodInventoryId', authenticateToken, async (req, res) => {
  try {
    const { hospitalId, bloodInventoryId } = req.params;

    if (!hospitalId || !bloodInventoryId) {
      return res.status(400).json({ message: 'Hospital ID and Blood Inventory ID are required.' });
    }

    const hospitalObjectId = new ObjectId(hospitalId);
    const hospital = await db.collection('hospitals').findOne({ _id: hospitalObjectId });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    // Authorization: Only the hospital itself or an admin can delete its inventory
    if (req.user.role !== 'admin' && req.user.id !== hospital.userId) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own hospital\'s blood inventory.' });
    }

    let updatedBloodInventory = [...hospital.bloodInventory || []];
    const initialLength = updatedBloodInventory.length;
    updatedBloodInventory = updatedBloodInventory.filter(item => item.id !== bloodInventoryId);

    if (updatedBloodInventory.length === initialLength) {
      return res.status(404).json({ message: 'Blood inventory entry not found.' });
    }

    const updateDoc = {
      $set: {
        bloodInventory: updatedBloodInventory,
        updatedAt: new Date().toISOString()
      }
    };

    await db.collection('hospitals').updateOne({ _id: hospitalObjectId }, updateDoc);

    res.status(204).send(); // No content for successful deletion

  } catch (error) {
    console.error('Error deleting blood inventory entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Hospital Route
app.put('/api/hospitals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, location, bloodInventory, beds, staff } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Hospital ID is required.' });
    }

    const hospital = await db.collection('hospitals').findOne({ _id: new ObjectId(id) });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    // Ensure only the hospital itself or an admin can update
    if (req.user.role !== 'admin' && req.user.id !== hospital.userId) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own hospital entry.' });
    }

    const updateDoc = {
      $set: {
        name: name || hospital.name,
        address: address || hospital.address,
        phone: phone || hospital.phone,
        email: email || hospital.email,
        location: location || hospital.location,
        bloodInventory: bloodInventory || hospital.bloodInventory,
        beds: beds || hospital.beds,
        staff: staff || hospital.staff,
        updatedAt: new Date().toISOString()
      }
    };

    await db.collection('hospitals').updateOne({ _id: new ObjectId(id) }, updateDoc);

    const updatedHospital = await db.collection('hospitals').findOne({ _id: new ObjectId(id) });

    res.status(200).json(updatedHospital);

  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Hospital Route
app.delete('/api/hospitals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Hospital ID is required.' });
    }

    const hospital = await db.collection('hospitals').findOne({ _id: new ObjectId(id) });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    // Ensure only the hospital itself or an admin can delete
    if (req.user.role !== 'admin' && req.user.id !== hospital.userId) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own hospital entry.' });
    }

    await db.collection('hospitals').deleteOne({ _id: new ObjectId(id) });

    res.status(204).send(); // No content for successful deletion

  } catch (error) {
    console.error('Error deleting hospital:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Hospitals Route (for selecting target hospitals in blood requests)
app.get('/api/hospitals', authenticateToken, async (req, res) => {
  try {
    const hospitals = await db.collection('hospitals').find({}).toArray();
    res.status(200).json(hospitals);
  } catch (error) {
    console.error('Error fetching all hospitals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Hospital Search Route (Patient Side) - Moved to ensure correct routing
app.get('/api/hospitals/search', authenticateToken, async (req, res) => {
  try {
    const { bloodType, lat, lng, city } = req.query; // Added city
    const query = {};
    let parsedLat = lat ? parseFloat(lat) : undefined;
    let parsedLng = lng ? parseFloat(lng) : undefined;

    console.log(`Hospital search request received. BloodType: ${bloodType}, Lat: ${lat}, Lng: ${lng}, City: ${city}`);

    // Hardcoded city coordinates for filtering if city is provided and no lat/lng
    const cityCoordinates = {
      'Chennai': [80.2707, 13.0827], // Longitude, Latitude
      'Bengaluru': [77.5946, 12.9716],
      'Mumbai': [72.8777, 19.0760],
      'Delhi': [77.2167, 28.6448],
      'Hyderabad': [78.4867, 17.3850],
      // Add more cities as needed
    };

    if (city && (!parsedLat || !parsedLng)) {
      const coords = cityCoordinates[city];
      if (coords) {
        parsedLng = coords[0];
        parsedLat = coords[1];
        console.log(`Geocoded city ${city} to: [${parsedLng}, ${parsedLat}] for search.`);
      } else {
        console.warn(`City ${city} not found in hardcoded coordinates. Skipping geospatial filter.`);
      }
    }

    if (bloodType) {
      query['bloodInventory.bloodType'] = bloodType;
      query['bloodInventory.units'] = { $gte: 1 }; // Ensure at least 1 unit is available
      console.log(`Added bloodType filter to query: ${bloodType}`);
    }

    if (parsedLat && parsedLng) { // Use parsedLat/Lng here to check if we have coordinates from any source
      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        console.error(`Invalid lat/lng provided: lat=${lat}, lng=${lng}`);
        return res.status(400).json({ message: 'Invalid latitude or longitude format.' });
      }

      query['location'] = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [parsedLng, parsedLat] },
          $maxDistance: 50000 // 50 kilometers
        }
      };
      console.log(`Added geospatial query for location: [${parsedLng}, ${parsedLat}] with maxDistance: 50km`);
    } else if (lat || lng) {
      console.warn(`Only one of lat/lng provided for search. Ignoring geospatial filter. Lat: ${lat}, Lng: ${lng}`);
    } else {
      console.log('No valid lat/lng or geocoded city location provided for search. Searching all hospitals.');
    }
    
    console.log('Final MongoDB query:', JSON.stringify(query));
    const hospitals = await db.collection('hospitals').find(query).toArray();
    console.log(`Found ${hospitals.length} hospitals before filtering by blood type.`);

    const filteredHospitals = hospitals.filter(hosp => {
      if (bloodType) {
        return Array.isArray(hosp.bloodInventory) && hosp.bloodInventory.some(blood => blood.bloodType === bloodType && blood.units > 0);
      }
      return true;
    });
    console.log(`Found ${filteredHospitals.length} hospitals after filtering by blood type.`);

    res.status(200).json(filteredHospitals);
  } catch (error) {
    console.error('Error searching hospitals:', error);
    res.status(500).json({ message: 'Server error during hospital search.', details: error.message });
  }
});

// Get Hospital by User ID Route
app.get('/api/hospitals/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Only allow fetching if the requesting user's ID matches the userId, or if they are an admin
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own hospital profile.' });
    }

    const hospital = await db.collection('hospitals').findOne({ userId: userId });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found for this user.' });
    }

    res.status(200).json(hospital);

  } catch (error) {
    console.error('Error fetching hospital by user ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Hospital by ID Route (for general hospital data)
app.get('/api/hospitals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Explicitly handle the /search route being caught by the /:id dynamic route
    if (id === 'search') {
      console.warn('Attempted to access /api/hospitals/search via /api/hospitals/:id route. This should not happen if routes are ordered correctly.');
      return res.status(404).json({ message: 'Please use the /api/hospitals/search endpoint for hospital searches.' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Hospital ID is required.' });
    }

    // Validate if the ID is a valid MongoDB ObjectId before attempting to query
    if (!ObjectId.isValid(id)) {
      console.error(`Invalid Hospital ID format received: ${id}`);
      return res.status(400).json({ message: 'Invalid Hospital ID format.' });
    }

    const hospital = await db.collection('hospitals').findOne({ _id: new ObjectId(id) });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    res.status(200).json(hospital);

  } catch (error) {
    console.error('Error fetching hospital data by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Blood Request Routes
app.post('/api/blood-requests/create', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Forbidden: Only hospitals can create blood requests.' });
    }

    const { targetHospitalId, bloodType, unitsRequested } = req.body;
    const requestingHospitalId = req.user.id; // The ID of the hospital user making the request

    if (!targetHospitalId || !bloodType || typeof unitsRequested === 'undefined' || unitsRequested <= 0) {
      return res.status(400).json({ message: 'Target Hospital ID, blood type, and valid units requested are required.' });
    }

    // Verify target hospital exists
    const targetHospital = await db.collection('hospitals').findOne({ userId: targetHospitalId });
    if (!targetHospital) {
      return res.status(404).json({ message: 'Target hospital not found.' });
    }

    const newBloodRequest = {
      requestingHospitalId: requestingHospitalId,
      targetHospitalId: targetHospital.userId, // Storing the userId of the target hospital
      bloodType,
      unitsRequested,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responseMessage: null
    };

    const result = await db.collection('bloodRequests').insertOne(newBloodRequest);
    const createdRequest = { ...newBloodRequest, _id: result.insertedId };

    res.status(201).json(createdRequest);

  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Outgoing Blood Requests for a Hospital
app.get('/api/blood-requests/outgoing/:hospitalId', authenticateToken, async (req, res) => {
  try {
    const { hospitalId } = req.params;

    if (!hospitalId) {
      return res.status(400).json({ message: 'Hospital ID is required.' });
    }

    // Authorization: Only the requesting hospital or an admin can view outgoing requests
    if (req.user.role !== 'admin' && req.user.id !== hospitalId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own outgoing blood requests.' });
    }

    const outgoingRequests = await db.collection('bloodRequests').find({ requestingHospitalId: hospitalId }).toArray();

    res.status(200).json(outgoingRequests);

  } catch (error) {
    console.error('Error fetching outgoing blood requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Incoming Blood Requests for a Hospital
app.get('/api/blood-requests/incoming/:hospitalId', authenticateToken, async (req, res) => {
  try {
    const { hospitalId } = req.params;

    if (!hospitalId) {
      return res.status(400).json({ message: 'Hospital ID is required.' });
    }

    // Authorization: Only the target hospital or an admin can view incoming requests
    if (req.user.role !== 'admin' && req.user.id !== hospitalId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own incoming blood requests.' });
    }

    const incomingRequests = await db.collection('bloodRequests').find({ targetHospitalId: hospitalId }).toArray();

    res.status(200).json(incomingRequests);

  } catch (error) {
    console.error('Error fetching incoming blood requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to a Blood Request
app.put('/api/blood-requests/:requestId/respond', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body; // status can be 'approved' or 'denied'

    if (!requestId || !status) {
      return res.status(400).json({ message: 'Request ID and status are required.' });
    }
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be 'approved' or 'denied'.` });
    }

    const bloodRequest = await db.collection('bloodRequests').findOne({ _id: new ObjectId(requestId) });

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found.' });
    }

    // Authorization: Only the target hospital (receiving the request) or an admin can respond
    if (req.user.role !== 'admin' && req.user.id !== bloodRequest.targetHospitalId) {
      return res.status(403).json({ message: 'Forbidden: You can only respond to requests sent to your hospital.' });
    }

    // Prevent responding to already processed requests
    if (bloodRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot respond to an already processed request.' });
    }

    const updateFields = {
      status,
      responseMessage: responseMessage || null,
      updatedAt: new Date().toISOString()
    };

    if (status === 'approved') {
      const respondingHospital = await db.collection('hospitals').findOne({ userId: bloodRequest.targetHospitalId });

      if (!respondingHospital) {
        console.error(`Responding hospital profile not found for userId: ${bloodRequest.targetHospitalId}`);
        return res.status(500).json({ message: 'Responding hospital profile not found.' });
      }

      let updatedBloodInventory = [...respondingHospital.bloodInventory || []];
      const bloodTypeIndex = updatedBloodInventory.findIndex(item => item.bloodType === bloodRequest.bloodType);

      if (bloodTypeIndex > -1) {
        if (updatedBloodInventory[bloodTypeIndex].units >= bloodRequest.unitsRequested) {
          updatedBloodInventory[bloodTypeIndex].units -= bloodRequest.unitsRequested;
          updatedBloodInventory[bloodTypeIndex].lastUpdated = new Date().toISOString();

          await db.collection('hospitals').updateOne(
            { userId: bloodRequest.targetHospitalId },
            { $set: { bloodInventory: updatedBloodInventory, updatedAt: new Date().toISOString() } }
          );
          updateFields.status = 'fulfilled'; // Mark as fulfilled if inventory updated
        } else {
          return res.status(400).json({ message: 'Insufficient blood units in inventory to fulfill request.' });
        }
      } else {
        return res.status(400).json({ message: 'Blood type not found in hospital inventory.' });
      }
    }

    await db.collection('bloodRequests').updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateFields }
    );

    const updatedBloodRequest = await db.collection('bloodRequests').findOne({ _id: new ObjectId(requestId) });
    res.status(200).json(updatedBloodRequest);

  } catch (error) {
    console.error('Error responding to blood request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Patient Routes
// No need for a separate Patient Routes comment block here, as search is now correctly placed

// Get Hospital by User ID Route
app.get('/api/hospitals/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Only allow fetching if the requesting user's ID matches the userId, or if they are an admin
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own hospital profile.' });
    }

    const hospital = await db.collection('hospitals').findOne({ userId: userId });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found for this user.' });
    }

    res.status(200).json(hospital);

  } catch (error) {
    console.error('Error fetching hospital by user ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Hospital by ID Route (for general hospital data)
app.get('/api/hospitals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Explicitly handle the /search route being caught by the /:id dynamic route
    if (id === 'search') {
      console.warn('Attempted to access /api/hospitals/search via /api/hospitals/:id route. This should not happen if routes are ordered correctly.');
      return res.status(404).json({ message: 'Please use the /api/hospitals/search endpoint for hospital searches.' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Hospital ID is required.' });
    }

    // Validate if the ID is a valid MongoDB ObjectId before attempting to query
    if (!ObjectId.isValid(id)) {
      console.error(`Invalid Hospital ID format received: ${id}`);
      return res.status(400).json({ message: 'Invalid Hospital ID format.' });
    }

    const hospital = await db.collection('hospitals').findOne({ _id: new ObjectId(id) });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    res.status(200).json(hospital);

  } catch (error) {
    console.error('Error fetching hospital data by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create SOS Request (Patient Side)
app.post('/api/sos/create', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Forbidden: Only patients can create SOS requests.' });
    }

    const { bloodType, urgency, message, lat, lng } = req.body;
    const patientId = req.user.id;

    if (!bloodType || !urgency || !lat || !lng) {
      return res.status(400).json({ message: 'Blood type, urgency, and location (lat/lng) are required for SOS.' });
    }

    const patientLocation = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };

    const newSOSRequest = {
      patientId,
      bloodType,
      urgency,
      message: message || null,
      location: patientLocation,
      status: 'active', // Initial status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Removed hospitalResponses from the initial patient SOS creation
    };

    const result = await db.collection('sos_requests').insertOne(newSOSRequest);
    const createdSOSRequest = { ...newSOSRequest, _id: result.insertedId };

    // Find nearby hospitals and add them to hospitalResponses
    // This part will now be handled separately for hospitals to view, not stored in the patient's SOS document directly
    // Max distance in meters (e.g., 50000 meters = 50 km)
    const nearbyHospitals = await db.collection('hospitals').find({
      location: {
        $nearSphere: {
          $geometry: patientLocation,
          $maxDistance: 50000 // 50 kilometers
        }
      }
    }).toArray();

    if (nearbyHospitals.length > 0) {
      const hospitalResponses = nearbyHospitals.map(hospital => ({
        hospitalId: hospital.userId, // Link to the hospital user ID
        status: 'pending',
        responseMessage: null,
        respondedAt: new Date().toISOString()
      }));

      // Update the SOS request to include hospitalResponses. This is where it was being added.
      // Since we want to remove this from the patient's view, we will remove this update.
      // However, we still need to record which hospitals were notified.
      // For now, we will assume the SOS is just created and hospitals will query for it.

      // To address the issue of hospitals not seeing initial responses, we need to add the hospitalResponses
      // to the SOS document, but ensure the frontend type definition will prevent issues on the patient side.
      await db.collection('sos_requests').updateOne(
        { _id: createdSOSRequest._id },
        { $set: { hospitalResponses: hospitalResponses, updatedAt: new Date().toISOString() } }
      );
      createdSOSRequest.hospitalResponses = hospitalResponses; // Keep for backend processing, type removed from frontend
    }

    res.status(201).json(createdSOSRequest);

  } catch (error) {
    console.error('Error creating SOS request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Incoming SOS Requests for a Hospital
app.get('/api/sos/hospital/:hospitalId', authenticateToken, async (req, res) => {
  try {
    const { hospitalId } = req.params;

    if (!hospitalId) {
      return res.status(400).json({ message: 'Hospital ID is required.' });
    }

    // Authorization: Only the target hospital or an admin can view incoming SOS requests
    if (req.user.role !== 'admin' && req.user.id !== hospitalId) {
      return res.status(403).json({ message: 'Forbidden: You can only view SOS requests for your hospital.' });
    }

    const incomingSOSRequests = await db.collection('sos_requests').find({
      'hospitalResponses.hospitalId': hospitalId,
      'hospitalResponses.status': 'pending' // Only show pending requests for this hospital
    }).toArray();

    res.status(200).json(incomingSOSRequests);

  } catch (error) {
    console.error('Error fetching incoming SOS requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to an SOS Request (Hospital Side)
app.put('/api/sos/:sosId/respond', authenticateToken, async (req, res) => {
  try {
    const { sosId } = req.params;
    const { status, responseMessage } = req.body; // status can be 'accepted' or 'denied'
    const hospitalId = req.user.id; // The ID of the hospital user responding

    if (!sosId || !status) {
      return res.status(400).json({ message: 'SOS ID and status are required.' });
    }
    if (!['accepted', 'denied'].includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be 'accepted' or 'denied'.` });
    }

    const sosRequest = await db.collection('sos_requests').findOne({ _id: new ObjectId(sosId) });

    if (!sosRequest) {
      return res.status(404).json({ message: 'SOS request not found.' });
    }

    // Ensure the responding hospital is one of the target hospitals for this SOS
    const hospitalResponseIndex = sosRequest.hospitalResponses.findIndex(hr => hr.hospitalId === hospitalId);
    if (hospitalResponseIndex === -1) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to respond to this SOS request.' });
    }
    
    // Prevent responding to an already responded request
    if (sosRequest.hospitalResponses[hospitalResponseIndex].status !== 'pending') {
      return res.status(400).json({ message: 'Cannot respond to an already processed SOS for your hospital.' });
    }

    let updateDoc = {
      $set: {
        updatedAt: new Date().toISOString(),
        [`hospitalResponses.${hospitalResponseIndex}.status`]: status,
        [`hospitalResponses.${hospitalResponseIndex}.responseMessage`]: responseMessage || null,
        [`hospitalResponses.${hospitalResponseIndex}.respondedAt`]: new Date().toISOString()
      }
    };

    if (status === 'accepted') {
      const bloodTypeNeeded = sosRequest.bloodType;
      const hospital = await db.collection('hospitals').findOne({ userId: hospitalId });

      if (!hospital) {
        console.error(`Responding hospital profile not found for userId: ${hospitalId}`);
        return res.status(500).json({ message: 'Responding hospital profile not found.' });
      }

      let updatedBloodInventory = [...hospital.bloodInventory || []];
      const bloodTypeIndex = updatedBloodInventory.findIndex(item => item.bloodType === bloodTypeNeeded);

      // For SOS, assume 1 unit is requested for simplicity, or we can add unitsNeeded to SOS schema
      const unitsToDecrement = 1; // Or sosRequest.unitsRequested if added to schema

      if (bloodTypeIndex > -1 && updatedBloodInventory[bloodTypeIndex].units >= unitsToDecrement) {
        updatedBloodInventory[bloodTypeIndex].units -= unitsToDecrement;
        updatedBloodInventory[bloodTypeIndex].lastUpdated = new Date().toISOString();

        await db.collection('hospitals').updateOne(
          { userId: hospitalId },
          { $set: { bloodInventory: updatedBloodInventory, updatedAt: new Date().toISOString() } }
        );

        // Optionally, if one hospital accepts, we might mark the overall SOS as resolved
        // or notify other hospitals that it's been handled.
        // For now, we'll just update this hospital's response.
        // You might want to update the main sosRequest.status to 'resolved' here if all units are fulfilled.
      } else {
        // If blood is insufficient, deny the request even if hospital tried to accept
        updateDoc.$set[`hospitalResponses.${hospitalResponseIndex}.status`] = 'denied';
        updateDoc.$set[`hospitalResponses.${hospitalResponseIndex}.responseMessage`] = 'Insufficient blood inventory.';
        return res.status(400).json({ message: 'Insufficient blood inventory to fulfill SOS request.' });
      }
    }

    await db.collection('sos_requests').updateOne(
      { _id: new ObjectId(sosId) },
      updateDoc
    );

    const updatedSOSRequest = await db.collection('sos_requests').findOne({ _id: new ObjectId(sosId) });
    res.status(200).json(updatedSOSRequest);

  } catch (error) {
    console.error('Error responding to SOS request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Routes
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required for chat.' });
    }

    const chatPrompt = `You are a helpful chatbot for a blood donation and health management system. Your purpose is to provide general, basic health information and guide users to relevant sections of the application or professional help. You must not provide specific medical advice, diagnoses, or treatment plans. If a user asks for specific medical advice, instruct them to consult a healthcare professional. Provide concise and relevant answers.

Here are some examples of what you can do:
- Explain different blood types and their compatibility.
- Describe the process of blood donation.
- Provide general information about common health conditions (e.g., symptoms of anemia, benefits of a balanced diet).
- Guide users on how to use the SOS feature or find nearby hospitals.

User: ${message}

Chatbot:`;

    const result = await model.generateContent(chatPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });

  } catch (error) {
    console.error('Error in chat with Gemini API:', error);
    res.status(500).json({ message: 'Server error during AI chat.', details: error.message });
  }
});

app.post('/api/ai/analyze-report', authenticateToken, async (req, res) => {
  try {
    const { reportText } = req.body;

    if (!reportText) {
      return res.status(400).json({ message: 'Report text is required for AI analysis.' });
    }

    // Construct the prompt for the Gemini model
    const prompt = `Analyze the following health report text and extract the key information in a JSON format. The JSON should contain:
- patientName (string): The name of the patient, or "Unknown" if not specified.
- summary (string): A concise summary of the report's main findings and overall health status.
- importantTopics (array of strings): A list of 3-5 important topics or main outcomes mentioned in the report.
- recommendations (array of strings): Any recommendations or next steps suggested in the report.
- urgency (string): 'critical', 'urgent', 'moderate', or 'low' based on the report's findings.
- bloodTestResults (object, optional): An object containing specific blood test results if available, e.g., { bloodType: "O+", hemoglobin: 12.5, whiteBloodCells: 7000, platelets: 200000 }.

Health Report:
"""
${reportText}
"""

Ensure the output is a valid JSON object.`;

    console.log('Sending prompt to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Received raw text from Gemini API:', text);

    // Attempt to parse the JSON response from Gemini
    let analysis;
    try {
      // Gemini might wrap the JSON in markdown code block, so try to extract it
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        analysis = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Error parsing Gemini API response JSON:', parseError);
      return res.status(500).json({ message: 'Failed to parse AI analysis response.', details: parseError.message });
    }

    res.json(analysis);

  } catch (error) {
    console.error('Error analyzing report with Gemini API:', error);
    // Log the full error object for detailed debugging
    console.error(error);
    res.status(500).json({ message: 'Server error during AI report analysis.', details: error.message });
  }
});

// Get SOS Requests for a Patient
app.get('/api/sos/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required.' });
    }

    // Authorization: Only the patient themselves or an admin can view their SOS requests
    if (req.user.role !== 'admin' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own SOS requests.' });
    }

    const patientSOSRequests = await db.collection('sos_requests').find({ patientId: patientId }).toArray();

    res.status(200).json(patientSOSRequests);

  } catch (error) {
    console.error('Error fetching patient SOS requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// New route for sending blood request SMS (simulated)
app.post('/api/sms/send-blood-request', authenticateToken, async (req, res) => {
  try {
    const { targetHospitalPhone, patientBloodType, patientName, message } = req.body;

    if (!targetHospitalPhone || !patientBloodType || !patientName || !message) {
      return res.status(400).json({ message: 'All required fields (hospital phone, patient blood type, patient name, message) are needed.' });
    }

    console.log(`--- ATTEMPTING TO SEND REAL SMS VIA TWILIO ---`);
    console.log(`To: ${targetHospitalPhone}`);
    console.log(`From: Patient ${patientName}`);
    console.log(`Blood Type Requested: ${patientBloodType}`);
    console.log(`Message: ${message}`);

    try {
      // Ensure the phone number is in E.164 format (e.g., +91XXXXXXXXXX)
      const formattedTargetPhone = targetHospitalPhone.startsWith(TWILIO_PHONE_NUMBER_PREFIX)
                                    ? targetHospitalPhone
                                    : `${TWILIO_PHONE_NUMBER_PREFIX}${targetHospitalPhone}`;

      const twilioResponse = await twilioClient.messages.create({
        body: message,
        messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
        to: formattedTargetPhone // Use the formatted phone number
      });

      console.log(`SMS successfully sent via Twilio. SID: ${twilioResponse.sid}`);
      res.status(200).json({ message: 'SMS blood request successfully sent.', twilioSid: twilioResponse.sid });

    } catch (twilioError) {
      console.error('Error sending real SMS via Twilio:', twilioError);
      // It's important to handle Twilio errors and decide how to respond to the frontend
      // For now, we'll log and return a 500 error.
      res.status(500).json({ message: 'Failed to send SMS via Twilio.', details: twilioError.message });
    }
  } catch (error) {
    console.error('Error sending simulated SMS:', error);
    res.status(500).json({ message: 'Server error during SMS simulation.', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`BloodDoc server running on port ${PORT}`);
});