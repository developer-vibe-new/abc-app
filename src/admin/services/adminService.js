var bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { SECRET_Key } = process.env;
const User = require("../../models/users");
const Car = require("../../models/cars");
const Taxitype = require("../../models/taxiTypeModel");
const provider_taxis = require("../../models/providerTaxi");
const operatorModel = require("../../models/operatorModel");
const adminRegisterModel = require("../../models/adminModel");
const { statusCode, resMessage } = require("../../config/default.json");
const Provider = require("../../models/providerModel");
const adminModel = require("../../models/adminModel");

exports.adminRegister = async (req) => {
  try {
    const findEmail = await adminRegisterModel.findOne({
      email: req.body.email,
    });
    if (findEmail) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.Unique_Email_Username,
      };
    }

    const insertAdminuser = await adminRegisterModel.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
    });
    if (insertAdminuser) {
      return {
        statusCode: statusCode.OK,
        success: true,
        message: resMessage.Admin_registered_successfully,
      };
    }
    return {
      success: false,
      data: [],
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
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.User_Not_Found,
      };
    }

    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      findData.password
    );
    if (!isPasswordMatch) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.Invalid_Password,
      };
    }

    // const auth_key = jwt.sign({ _id: findData._id }, SECRET_Key, {
    //   expiresIn: "24h",
    // });
    const auth_key = jwt.sign({ _id: findData._id }, SECRET_Key, {
      expiresIn: "24h", // Token will expire in 1 day
    });
    await adminRegisterModel.updateOne(
      { email: req.body.email },
      { verification_token: auth_key }
    );
    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.User_login_Successfully,
      token: auth_key,
    };
  } catch (error) {
    console.log(error);
  }
};

exports.operatorsList = async (req) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    let searchCriteria = {};
    if (req.query.search) {
      const fullNameSearch = new RegExp(req.query.search, "i");
      searchCriteria.fullName = fullNameSearch;
    }
    const data = await operatorModel
      .find(searchCriteria)
      .skip(skip)
      .limit(pageSize)
      .select("fullName phone city status is_active");
    const totalCount = await operatorModel.countDocuments(searchCriteria);
    if (!data) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.Data_Not_Found,
      };
    }
    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Data_Fetch_Successfully,
      data,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

exports.updateOperator = async (req) => {
  try {
    const { id } = req.body;
    const operator = await operatorModel.findById(id);
    if (!operator) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.Operator_Not_Exist,
      };
    }

    const updatedStatus = operator.is_active === false ? true : false;

    const updateData = await operatorModel.findByIdAndUpdate(
      id,
      { is_active: updatedStatus },
      { new: true }
    );

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Status_Updated_Successfully,
      data: { updateData },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred",
      data: null,
    };
  }
};

exports.dashboardData = async (req, res) => {
  try {
    const totalProviders = await Provider.find().countDocuments();
    const totalUsers = await User.find().countDocuments();
    const totalCars = await Car.find().countDocuments();
    const totalTaxiType = await Taxitype.find().countDocuments();
    const onlineDriverList = await Provider.find({
      is_online: true,
    }).countDocuments();
    return {
      status: statusCode.OK,
      success: true,
      data: {
        totalProviders,
        totalUsers,
        totalCars,
        totalTaxiType,
        onlineDriverList,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: resMessage.Internal_Server_Error,
      error: error.message || "Internal Server Error",
    };
  }
};

exports.changePassword = async (req) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.Required_Data,
      };
    }
    const user = await adminModel.findById(req.auth._id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (isMatch === true) {
      if (newPassword === confirmPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await adminModel.findByIdAndUpdate(req.auth._id, {
          password: hashedPassword,
        });
        return {
          status: statusCode.OK,
          success: true,
          message: resMessage.Password_Changed_Successfully,
        };
      } else {
        return {
          status: statusCode.BAD_REQUEST,
          success: false,
          message: resMessage.New_Password_Confirm_Password_Not_Matched,
        };
      }
    }
    return {
      status: statusCode.BAD_REQUEST,
      success: false,
      message: resMessage.Incorrect_Old_Password,
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

exports.updateOperatorStatus = async (req) => {
  try {
    const { id } = req.body;
    const operator = await operatorModel.findById(id);
    if (!operator) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.Operator_Not_Exist,
      };
    }

    const updatedStatus = operator.status === "unblock" ? "block" : "unblock";

    const updateData = await operatorModel.findByIdAndUpdate(
      id,
      { status: updatedStatus },
      { new: true }
    );

    const responseMessage =
      updatedStatus === "block"
        ? resMessage.Operator_Blocked_Successfully
        : resMessage.Operator_Unblocked_Successfully;

    return {
      status: statusCode.OK,
      success: true,
      message: responseMessage,
      data: { updateData },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred",
      data: null,
    };
  }
};

exports.getOperatorDetailsService = async (req) => {
  try {
    const { id } = req.params;

    const data = await operatorModel.findById(id);
    if (!data || data == undefined) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.Data_Not_Found,
      };
    }
    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Data_Fetch_Successfully,
      data,
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: resMessage.Internal_Server_Error,
      error: error.message || "Internal Server Error",
    };
  }
};

exports.editOperatorDetailsService = async (req) => {
  try {
    const { fullName, phone, city } = req.body;
    const editOperatorData = await operatorModel.findByIdAndUpdate(
      req.params.id,
      { fullName, phone, city },
      { new: true }
    );

    if (!editOperatorData) {
      return {
        status: statusCode.DATA_NOT_FOUND,
        success: false,
        message: resMessage.Data_Not_Found,
      };
    }
    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Data_Updated_Successfully,
      data: editOperatorData,
    };
  } catch (error) {
    console.error(error);
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: resMessage.Internal_Server_Error,
      error: error.message || "Internal Server Error",
    };
  }
};

exports.checkAuthService = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.Token_Required,
      };
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_Key);

    const adminData = await adminModel.findById(decoded._id);

    if (!decoded) {
      return {
        statusCode: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.Invalid_Token,
      };
    }
    decoded.cityId = adminData.city_id;
    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Data_Fetch_Successfully,
      decoded: decoded
    };
  
  } catch (error) {
    return {
      status: statusCode.UNAUTHORIZED,
      success: false,
      message: resMessage.Invalid_Token,
      error: error.message,
    };
  }
};

exports.updateAdminCity = async (req) => {
  try {
    const { _id } = req.auth;
    const { cityId } = req.body;
    await adminModel.findByIdAndUpdate(_id,
      { city_id: cityId }
    );
    return {
      status: statusCode.OK,
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.City_Updated_Successfully
    }
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
}