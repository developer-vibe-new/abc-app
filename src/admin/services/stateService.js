const mongoose = require('mongoose');
const { State } = require('../../models/stateModel');
const { City } = require('../../models/city');

exports.stateCreate = async (req, res, next) => {
    try {
        const findState = await State.find({ state: req.body.state });
        if (findState.length > 0) {
            return {
                success: false,
                message: "State Already Exits",
                data: findState[0]
            }
        }
        const state = new State({ state: req.body.state });
        const getState = await state.save();

        if (getState) {
            return {
                success: true,
                message: "state added successfully",
                data: getState
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success:false,
            message:"An error occured while creating State "
        }
    }
};

exports.stateUpdate = async (req, res, next) => {
    try {

        const updateState = await State.findByIdAndUpdate({ _id: req.body.id }, { state: req.body.state }, { new: true });
        if (updateState) {
            return {
                success: true,
                message: "state updated successfully",
                data: updateState
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success:false,
            message:"An error occured while Updateing state"
        }
    }
};

exports.stateDelete = async (req, res, next) => {
    try {
        console.log(req.params, "kkkkkkkkk");
        const deleteSate = await State.findByIdAndDelete({
            _id: req.params.id
        })
        if (deleteSate) {
            return {
                success: true,
                message: "state deleted successfully",
                data: deleteSate
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message:"An error occured while deleting state"
        }
    }
};

exports.stateView = async (req, res, next) => {
    try {
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        let search_value = req.query.search || "";
        var conditions; 

        if (search_value) {
            conditions = _.assign(conditions, { $or: [{ "state": { $regex: new RegExp(search_value, "gi") } }] });
        }

        const allData = await State.find(conditions)
            .sort({state:-1})
            .skip((page - 1) * pagesize).
            limit(pagesize);
        if (allData) {
            return {
                success: true,
                data: allData
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success:false,
            message:"An error occured while fetching State Data "
        }
    }
};

exports.cityCreate = async (req, res, next) => {
    try {
        const FindCity = await City.find({})
        if (FindCity.length > 0) {
            return {
                success: false,
                message: "City Already Exits",
                data: FindCity
            }
        }
        const addCity = await City.create({
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
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success:false,
            message:"An error occured while creating city data"
        }
    }
};

exports.cityUpdate = async (req, res, next) => {
    try {
        const body = req.body
        const updateCity = await City.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(req.body.id) }, body, { new: true });
        if (updateCity) {
            return {
                success: true,
                message: "City updated successfully",
                data: updateCity
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success:false,
            message:"An error occured while Upadeting city data"
        }
    }
};

exports.cityDelete = async (req, res, next) => {
    try {
        const deleteData = await City.findByIdAndDelete({ _id: req.params.id });
        if (deleteData) {
            return {
                success: true,
                message: "City Deleted successfully",
                data: deleteData
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success:false,
            message:"An error occured while deleting city data"
        }
    }
};
exports.cityView = async (req, res, next) => {
    try {
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        let search_value = req.query.search || "";
        var conditions; 
        
        if (search_value) {
            conditions = _.assign(conditions, { $or: [{ "name": { $regex: new RegExp(search_value, "gi") } }] });
        }

        const allData = await City.find(conditions)
            .sort({name:1})
            .skip((page - 1) * pagesize).
            limit(pagesize);

        if (allData) {
            return {
                success: true,
                data: allData
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success:false,
            message:"An error occured while fetching city data"
        }
    }
};
