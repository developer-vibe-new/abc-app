var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_Key } = process.env;
const operatorModel = require('../../models/operatorModel');
const adminRegisterModel = require('../../models/adminModel');
const { statusCode, resMessage } = require('../../config/default.json');






exports.adminRegister = async (req) => {
    try {
        const findEmail = await adminRegisterModel.find({ email: req.body.email });
        if (findEmail.length > 0) {
            return {
                message: "The email address you have entered is already in use.",
                status: false,
                data: { email: findEmail[0].email },
            };
        }

        const insertAdminuser = await adminRegisterModel.create({
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
        return {
            success: false,
            data: []
        };
    } catch (error) {
        console.log(error);
    }
};

exports.login = async (req) => {
    try {
        let findData = await adminRegisterModel.findOne({
            email: req.body.email,
        });


        if (!findData) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, findData.password);
        if (!isPasswordMatch) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Incorrect_Username_Password
            };
        }

        const auth_key = jwt.sign({ _id: findData._id }, SECRET_Key, { expiresIn: "24h" });
        await adminRegisterModel.updateOne(
            { email: req.body.email },
            { verification_token: auth_key }
        );
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.User_login_Successfully,
            token: auth_key
        };
    } catch (error) {
        console.log(error);
    }
};

exports.operatorsList = async (req) => {
    try {
        let page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;
        let search_value = req.query.search || "";
        var conditions = [];

        // if (search_value) {
        //     conditions = _.assign(conditions, { $or: [{ "fullName": { $regex: new RegExp(search_value, "gi") } }] });
        // }
        if (search_value) {
            conditions.push({
                $match: {
                    fullName: { $regex: search_value }
                }
            });
        }
        conditions.push({ $sort: { fullName: 1 } }, { $skip: ((page - 1) * pagesize) },
            { $limit: pagesize });
        const operatorsData = await operatorModel.aggregation(conditions);
        if (operatorsData.length == 0) {

            return {
                success: false,
                message: "No Data Found",

            };
        } else {

            return {
                success: true,
                data: operatorsData
            };
        }
    } catch (error) {
        console.log(error);
    }
};

exports.updateOperator = async (req) => {
    try {
        const updateData = await operatorModel.findByIdAndUpdate({ _id: req.params._id }, { status: false }, { new: true });
        return {
            success: true,
            data: updateData
        };
    } catch (error) {
        console.log(error);
    }
};

