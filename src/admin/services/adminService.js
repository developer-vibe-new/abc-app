var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_Key } = process.env;
const User = require('../../models/users');
const Car = require('../../models/cars');
const Taxitype = require('../../models/taxiTypeModel');
const operatorModel = require('../../models/operatorModel');
const adminRegisterModel = require('../../models/adminModel');
const { statusCode, resMessage } = require('../../config/default.json');
const Provider = require('../../models/providerModel');

exports.adminRegister = async (req) => {
    try {
        const findEmail = await adminRegisterModel.findone({ email: req.body.email });
        if (findEmail) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Unique_Email_Username

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
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.User_login_Successfully,
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
                message: resMessage.User_Not_Found,

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
        const operatorsData = await operatorModel.aggregate(conditions);
        if (operatorsData.length == 0) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found,

            };
        } else {
            return {
                statusCode: statusCode.OK,
                success: true,
                data: { operatorsData }
            };
        }
    } catch (error) {
        console.log(error);
    }
};

exports.updateOperator = async (req) => {
    try {
        const updateData = await operatorModel.findByIdAndUpdate({ _id: req.params.id }, { status: false }, { new: true });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Status_Updated_Successfully,
            data: { updateData }
        };
    } catch (error) {
        console.log(error);
    }
};

exports.dashboardData = async (req, res) => {
    try {
        const totalProviders = await Provider.find().countDocuments();
        const totalUsers = await User.find().countDocuments();
        const totalCars = await Car.find().countDocuments();
        const totalTaxiType = await Taxitype.find().countDocuments();
        const onlineDriverList = await Provider.find({ is_online: true }).countDocuments();
        return {
            status: statusCode.OK,
            success: true,
            data: { 
                totalProviders,
                totalUsers,
                totalCars,
                totalTaxiType,
                onlineDriverList
            }
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}