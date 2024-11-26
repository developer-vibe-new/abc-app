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

exports.viewSubAdmin = async () => {
    try {
        let page = req.query.page || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;

        let pipeline = [];
        pipeline.push({
            $match: {
              role_type: "manager"
            }
          },
          {
            $project: {
              first_name: 1,
              last_name: 1,
              email: 1,
              mobile: 1
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        });
        const data = await Admin.aggregate(pipeline);
        if(!data) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        const totalDocuments = await Admin.countDocuments({ role_type: "manager" });
        const totalPages = Math.ceil(totalDocuments / limit);
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: {
                items: data,
                meta: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: totalDocuments,
                    itemsPerPage: limit
                }
            }
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}