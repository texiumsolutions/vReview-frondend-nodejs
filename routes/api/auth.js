const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const AuditTrail = require('../../models/AuditTrail');
const auth = require('../../middleware/auth');

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            const auditTrail = new AuditTrail({
                action: 'USER_LOGIN_FAILURE',
                details: `Failed login attempt for email: ${email}`
            });
            await auditTrail.save();
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const auditTrail = new AuditTrail({
            user: user.id,
            action: 'USER_LOGIN_SUCCESS',
            details: `User ${user.email} logged in successfully.`
        });
        await auditTrail.save();


        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            'yourSecretToken', // You should use an environment variable for this
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth
// @desc    Get user by token
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;