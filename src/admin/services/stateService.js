const mongoose = require('mongoose');
const stateModel = require('../../models/stateModel');
const cityModel = require('../../models/city');
const { statusCode, resMessage } = require('../../config/default.json');

exports.stateCreate = async (req) => {
    try {
        console.log(req.body.state);
        const findState = await stateModel.findOne({ state: req.body.state });
        if (findState) {
            return {
                success: false,
                message: "State Already Exits",
                data: findState
            };
        }
        const state = new stateModel({ state: req.body.state });
        const getState = await state.save();

        if (getState) {
            return {
                success: true,
                message: "state added successfully",
                data: getState
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occured while creating State "
        };
    }
};

exports.stateUpdate = async (req) => {
    try {

        const updateState = await stateModel.findByIdAndUpdate({ _id: req.body.id }, { state: req.body.state }, { new: true });
        if (updateState) {
            return {
                success: true,
                message: "state updated successfully",
                data: updateState
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occured while Updateing state"
        };
    }
};

exports.stateDelete = async (req) => {
    try {
        const deleteSate = await stateModel.findByIdAndDelete({
            _id: req.params.id
        });
        if (deleteSate) {
            return {
                success: true,
                message: "state deleted successfully",
                data: deleteSate
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occured while deleting state"
        };
    }
};

exports.stateView = async (req) => {
    try {
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        let search_value = req.query.search || "";
        var conditions = [];


        if (search_value) {
            conditions.push({
                $match: {
                    state: { $regex: search_value, $options: "i" }
                }
            });
        }
        conditions.push(
            { $sort: { state: -1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );
        const allData = await stateModel.aggregate(conditions);

        if (allData) {
            return {
                success: true,
                data: allData
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occured while fetching State Data "
        };
    }
};

exports.cityCreate = async (req) => {
    try {
        const { name, city, state, country, coordinates } = req.body;
        const FindCity = await cityModel.findOne({ city: req.body.city });
        if (FindCity) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Already_Exist
            };
        }
        const newCity = new cityModel({
            name,
            city,
            state,
            country,
            coordinates
        });
        await newCity.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.City_created_successfully,
            data: newCity
        }
    } catch (error) {
        return {
            status: statusCode.Internal_Server_Error,
            success: false,
            message: error.message
        };
    }
};

exports.cityUpdate = async (req) => {
    try {
        const { id } = req.params;
        const { name, city, state, country, coordinates } = req.body;

        const updateCity = await cityModel.findOneAndUpdate(
            { _id: id, is_active: true },
            { name, city, state, country, coordinates },
            { new: true }
        );

        if (updateCity) {
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.City_Updated_Successfully,
                data: updateCity
            };
        } else {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.City_not_found
            };
        }
    } catch (error) {
        console.log(error);
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.cityDelete = async (req) => {
    try {
        const { id } = req.params;
        const deleteData = await cityModel.findByIdAndUpdate(id,
            { is_active: false },
            { new: true }
        );
        if (deleteData) {
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.City_Deleted_Successfully,
                data: deleteData
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occured while deleting city data"
        };
    }
};

exports.cityView = async (req) => {
    try {
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        let search_value = req.query.search || "";
        var conditions = [];

        if (search_value) {
            conditions.push({
                $match: {
                    name: { $regex: search_value, $options: "i" }
                }
            });
        }
        conditions.push(
            { $match: { is_active: true } }
        );
        conditions.push(
            { $sort: { name: 1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );
        const allData = await cityModel.aggregate(conditions);

        if (allData) {
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.Data_Fetch_Successfully,
                data: allData
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occured while fetching city data"
        };
    }
};

exports.viewCityById = async (req) => {
    try {
        const { id } = req.params;
        const cityData = await cityModel.findOne({ _id: id, is_active: true });
        if(!cityData) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.City_not_found
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: cityData
        }
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}