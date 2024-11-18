

var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_Key } = process.env;
const operatorModel = require('../../models/operatorModel')
const adminRegisterModel = require('../../models/adminModel');






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

exports.login = async (req, res, next) => {
    try {

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
            return {
                status: false,
                message: "Incorrect Password"
            }
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

exports.operatorsList = async (req, res, next) => {
    try {
        let page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;
        let search_value = req.query.search || "";
        var conditions;

        if (search_value) {
            conditions = _.assign(conditions, { $or: [{ "fullName": { $regex: new RegExp(search_value, "gi") } }] });
        }
        const operatorsData = await operatorModel.find(conditions)
            .sort({ fullName: 1 })
            .skip((page - 1) * pagesize).
            limit(pagesize);
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

exports.updateOperator = async (req, res, next) => {
    try {
        const updateData = await operatorModel.findByIdAndUpdate({_id:req.params.id},{ status: false }, { new: true })
        return {
            success: true,
            data: updateData
        };
    } catch (error) {
        console.log(error);
    }
}

