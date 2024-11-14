
const services = require('../services/stateService');




exports.createState = async(req,res,next)=>{
    try {
        const stateData = await services.stateCreate(req);
        
        // console.log("stateData", stateData);
        if(stateData.success){
            return res
              .status(200)
              .json(Object.assign({ status: stateData.success }, stateData));

        } else {
            return res.status(400)
            .json(Object.assign({status:stateData.success}))
        }

    } catch (error) {
        console.log(error);
    }
};

exports.updateState =async(req,res,next)=>{
    try {
        const updatedData = await services.stateUpdate(req);
        if(updatedData.success == true){
            return res.status(200)
            .json(Object.assign({ status: updatedData.success }, updatedData))
        } else {
            return res.status(400)
            .json(Object.assign({status:updatedData.success}))
        }
    } catch (error) {
        console.log(error);
    }
};

exports.deleteState = async(req,res,next)=>{
    try {
        const deleteData = await services.stateDelete(req);
        if(deleteData){
            return res.status(200).json(Object.assign({ status: deleteData.success},{message:deleteData.message},deleteData ))
        } 
    } catch (error) {
        console.log(error);
    }
};

exports.viewState = async(req,res,next)=>{
    try {
        const ViewData = await services.stateView(req);
        if(ViewData){
            return res.status(200).json(Object.assign({ status: ViewData.success},ViewData ))
        } 
    } catch (error) {
        console.log(error);
    }
};

exports.createCity = async(req,res,next)=>{
    try {
        const cityData = await services.cityCreate(req);
        if(cityData){
            return res.status(200).json(Object.assign({status:cityData.success},cityData))
        } else {
            return res.status(400).json(Object.assign({status:cityData.success},cityData))
        }
    } catch (error) {
        console.log(error);
    }
};

exports.updateCity = async(req,res,next)=>{
    try {
        const cityData = await services.cityUpdate(req);
        if(cityData){
            return res.status(200).json(Object.assign({status:cityData.success},cityData))
        }
    } catch (error) {
        console.log(error);
    }
};

exports.deleteCity = async(req,res,next)=>{
    try {
        const cityData = await services.cityDelete(req);
        if(cityData){
            return res.status(200).json(Object.assign({status:cityData.success},{message:cityData.message}))
        }
    } catch (error) {
        console.log(error);
    }
};

exports.viewCity = async(req,res,next)=>{
    try {
        const ViewData = await services.cityView(req);
        if(ViewData){
            return res.status(200).json(Object.assign({ status: ViewData.success},ViewData ))
        } 
    } catch (error) {
        console.log(error);
    }
};
