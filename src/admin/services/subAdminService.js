const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
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

exports.viewSubAdmin = async (req) => {
    try {
        let page = req.query.page || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;

        let pipeline = [];
        pipeline.push({
            $match: {
              role_type: "manager",
              is_active: true
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
            data,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalDocuments,
                itemsPerPage: limit
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

exports.editSubAdmin = async (req) => {
    try {
        const { id } = req.params;
        const data = await Admin.aggregate([
            {
              $match: {
                  _id: new mongoose.Types.ObjectId(id),
                  role_type: "manager",
                  is_active: true
              }
            },
            {
              $project: {
                first_name: 1,
                last_name: 1,
                email: 1,
                mobile: 1,
                permission: 1
              }
            }
        ]);
        if(data.length === 0) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}

exports.updateSubAdmin = async (req) => {
    try {
        const { id } = req.params;
        const data = await Admin.findOne({ _id: id, role_type: 'manager', is_active: true });
        if(!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        const { first_name, last_name, email, mobile, password, permission } = req.body;
        let passwordHash;
        if(password !== "" && password) {
            passwordHash = await bcrypt.hash(password, 10);
        }
        const updateData = await Admin.findByIdAndUpdate(id,
            { 
                first_name,
                last_name,
                email,
                mobile,
                password: passwordHash,
                permission
            },
            { new: true }
        );
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully,
            data: updateData
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}

exports.deleteSubAdmin = async (req) => {
    try {
        const { id } = req.body;
        if(!id) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Id_is_required
            }
        }
        console.log(req.body, "fvev")
        const data = await Admin.findOne({ _id: id, role: "manager", is_active: true });
        if(data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        await Admin.findByIdAndUpdate(id, { is_active: false});
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Deleted_Successfully
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}