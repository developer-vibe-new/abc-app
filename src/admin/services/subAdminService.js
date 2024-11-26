const bcrypt = require('bcrypt');
const { statusCode, resMessage } = require('../../config/default.json');
const Admin = require('../../models/adminModel');

exports.addSubAdmin = async (req) => {
    try {
        const { first_name, last_name, email, mobile, password, permission } = req.body;
        const findEmail = await Admin.findOne({ email });
        if(!findEmail) {
            const passwordHash = await bcrypt.hash(password, 10);
            const subAdmin = await Admin.create({ first_name, last_name, email, mobile, password: passwordHash, permission });
            return {
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.Data_Created_Successfully,
                data: subAdmin
            }
        }
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Data_Already_Exist,
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}