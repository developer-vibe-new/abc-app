const mongoose = require('mongoose');
const stateModel = require('../../models/stateModel');
const cityModel = require('../../models/city');

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
        const FindCity = await cityModel.findOne({ name: req.body.name });
        if (FindCity) {
            return {
                success: false,
                message: "City Already Exits",
                data: []
            };
        }
        const addCity = await cityModel.create({
            name: req.body.name,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country
        });

        if (addCity) {
            return {
                success: true,
                message: "City Created successfully",
                data: addCity
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occured while creating city data"
        };
    }
};

exports.cityUpdate = async (req) => {
    try {
        const body = req.body;
        const updateCity = await cityModel.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(req.body.id) }, body, { new: true });
        if (updateCity) {
            return {
                success: true,
                message: "City updated successfully",
                data: updateCity
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occured while Upadeting city data"
        };
    }
};

exports.cityDelete = async (req) => {
    try {
        const deleteData = await cityModel.findByIdAndDelete({ _id: req.params.id });
        if (deleteData) {
            return {
                success: true,
                message: "City Deleted successfully",
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
            { $sort: { name: 1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );
        const allData = await cityModel.aggregate(conditions);
        // .sort({name:1})
        // .skip((page - 1) * pagesize).
        // limit(pagesize);

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
            message: "An error occured while fetching city data"
        };
    }
};
