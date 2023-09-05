const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/userSchema');
const Admin = require('../models/adminSchema');
const Event = require('../models/eventSchema');
const EventParticipants= require('../models/participantsSchema')
const sequelize = require('../config/db')



exports.register = async (req, res) => {
  const { name, email, password, location } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, location });

    res.status(201).json({ user, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.adregister = async (req, res) => {
  const { adminname, email, password, location } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ adminname, email, password: hashedPassword, location });

    res.status(201).json({ admin, message: 'Admin registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
  
      const token = jwt.sign({ userId: user.id }, 'secret_key');
  
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  exports.adlogin = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
  
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
  
      const token = jwt.sign({ adminId: admin.id }, 'secret_key');
  
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  exports.create = async (req, res) => {
    const { title, description, startTime, endTime, location } = req.body;
    const { adminId } = req;
    try {
      var currentStatus;
      var currentDate = new Date().getTime();
      var dateOne = new Date(endTime).getTime();
      if (currentDate < dateOne) {
        currentStatus = "Active";
      } else {
        currentStatus = "Inactive";
      }
  
      if (adminId) {
        const event = await Event.create({
          title,
          description,
          startTime,
          endTime,
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
          organizerId: adminId,
          Status: currentStatus,
        });
  
        res.status(201).json({ event, message: 'Event created successfully' });
      } else {
        res.status(403).json({ message: 'Admin can only create events' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  exports.booking = async (req, res) => {
    const { eventId } = req.body;
    const { userId } = req;
  
    try {
      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      const currentDateTime = new Date();
      const eventStartTime = new Date(event.startTime);
      const eventEndTime = new Date(event.endTime);
      console.log(eventStartTime)
      console.log(eventEndTime)
  
      // Check if the event is already in the past
      if (eventEndTime < currentDateTime) {
        return res.status(400).json({ message: 'Event has already ended' });
      }
  
      // Check for overlapping event times
      const overlappingEvent = await Event.findOne({
        where: {
          id: { [Op.ne]: eventId }, 
          startTime: { [Op.lt]: eventEndTime },
          endTime: { [Op.gt]: eventStartTime },
        },
      });
      console.log(overlappingEvent.id)
      if (overlappingEvent) {
        const over = await EventParticipants.findOne({where:{eventId:overlappingEvent.id,userId:userId}})
        if(over){
            return res.status(409).json({ message: 'Event time overlaps with another event' });
          }
      }

  
      // Add the user as a participant with status 'going'
      const eventparti = await EventParticipants.findOne({ where: { eventId:eventId ,userId:userId}})
      console.log(eventparti)
      if(eventparti){
        return res.status(400).json({ message: 'Event already booked' });
       
      }
      const parti = EventParticipants.create({
        eventId,
        userId,
        status:'going',

      })
      //await event.addParticipant(parti);
  
      res.json({ message: 'Event booked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  exports.findAll = async (req, res) => {
    try {
      const events = await Event.findAll({ order: [['id', 'DESC']] });
      res.send(events);
    } catch (error) {
      res.status(500).send({
        message: error.message || "Some error occurred while retrieving event details."
      });
    }
  };

  exports.cancel = async (req, res) => {
    const { eventId } = req.body;
    const { userId } = req;
  
    try {
        console.log(eventId)
      const event = await EventParticipants.findOne({ where: { eventId:eventId, userId:userId } });
      console.log(event)
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      const currentDateTime = new Date();
      const eightHoursFromNow = new Date(currentDateTime.getTime() + 8 * 60 * 60 * 1000);
  
      if (event.startTime < eightHoursFromNow) {
        return res.status(400).json({ message: 'Event cancellation not allowed' });
      }
  
      await event.update({status:'cancelled'});
  
      res.json({ message: 'Event cancellation successful' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  exports.getAll = async (req, res) => {
    const { userId } = req;
    try {
      const events = await Event.findAll({
        include: [
          {
            model: EventParticipants,
            required: false,
            on: {
              eventId: { [Op.eq]: sequelize.col('Event.eventId') },
            },
          },
        ],
        
      });
      console.log(events)
   
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  exports.nearby = async (req, res) => {
    const { latitude, longitude } = req.query;
  
    try {
      console.log(latitude,longitude)
      const events = await Event.findAll({
              where: sequelize.where(
                sequelize.fn('ST_Distance_Sphere', sequelize.col('location'), sequelize.fn('POINT', longitude, latitude)),
                { [Op.lte]: 30000 } // Max distance in meters
              ),})
      /* const events = await Event.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: 30000,
          },
        },
      }).populate('organizer', 'name'); */
      console.log(events)
  
      if (events.length > 0) {
        res.send(events);
      } else {
        res.status(500).json({ message: 'No nearby events' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
   
  // exports.nearby = async (req, res) => {
  //   const { latitude, longitude } = req.query;
  
  //   try {
  //     const events = await Event.findAll({
  //       where: sequelize.where(
  //         sequelize.fn('ST_Distance_Sphere', sequelize.col('location'), sequelize.fn('POINT', longitude, latitude)),
  //         { [Op.lte]: 30000 } // Max distance in meters
  //       ),
  //       include: [
  //         {
  //           model: Admin,
  //           as: 'organizer',
  //           attributes: ['name'],
  //         },
  //       ],
  //     });
  
  //     if (events.length > 0) {
  //       res.json(events);
  //     } else {
  //       res.status(404).json({ message: 'No nearby events' });
  //     }
  //   } catch (error) {
  //     res.status(500).json({ message: 'Internal server error' });
  //   }
  // };
  
  exports.participants = async (req, res) => {
    const { eventId } = req.body;
  
    try {
      const event = await Event.findByPk(eventId, {
        include: [
          {
            model: User,
            as: 'participants',
            attributes: ['name'],
          },
        ],
      });
  
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      res.json(event.participants);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

