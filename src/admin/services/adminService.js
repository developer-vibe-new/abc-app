

var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_Key } = process.env;
const session = require("express-session");
const adminRegisterModel = require('../../models/registerModel');






exports.adminRegister = async (req, res, next) => {
    try {
        const findEmail = await adminRegisterModel.find({ email: req.body.email })
        if (findEmail.length > 0) {
            return {
                message: "The email address you have entered is already in use.",
                status: false,
                data: { email: findEmail[0].email },
            }
        }
        // const findUsername = await adminRegisterModel.find({ username: req.body.username });
        // if (findUsername.length > 0) {
        //     return {
        //         message: "The username you have entered is already in use.",
        //         status: false,
        //         data: { username: findUsername[0].username },
        //     }
        // }

        const insertAdminuser = await adminRegisterModel.create({
            // username: req.body.username,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password

        });
        if (insertAdminuser) {
            return {
                status: true,
                message: "User Registered Successfully",
                data: insertAdminuser,
            };
        }
        return res.status(404).json({
            success: false,
            data: []
        });
    } catch (error) {
        console.log(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        console.log("jjjjjjjjjjjjjjj")
        let findData = await adminRegisterModel.find({
            email: req.body.email,
        });


        if (!findData || findData.length === 0) {
            return {
                status: false,
                message: "User not found"
            };
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, findData[0].password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                status: false,
                message: "Incorrect Password"
            })
        }
      
        const auth_key = jwt.sign({ _id: findData[0]._id }, SECRET_Key, { expiresIn: "24h" });
        await adminRegisterModel.updateOne(
            { email: req.body.email },
            { verification_token: auth_key }
        );
        // console.log(req.session,"req.session")
        // req.session.auth_key = auth_key;
        return {
            status: true,
            message: "User login Successfully",
            data: []
        };
    } catch (error) {
        console.log(error);
    }
};

exports.dashboard = async (req, res, next) => {
    try {

    } catch (error) {
        console.log(error);
    }
}

