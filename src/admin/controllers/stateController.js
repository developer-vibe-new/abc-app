
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
        console.error("Error in createState:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
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
        console.error("Error in updateState:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.deleteState = async(req,res,next)=>{
    try {
        const deleteData = await services.stateDelete(req);
        if(deleteData){
            return res.status(200).json(Object.assign({ status: deleteData.success},{message:deleteData.message},deleteData ))
        } 
    } catch (error) {
        console.error("Error in deleteState:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.viewState = async(req,res,next)=>{
    try {
        const ViewData = await services.stateView(req);
        if(ViewData){
            return res.status(200).json(Object.assign({ status: ViewData.success},ViewData ))
        } 
    } catch (error) {
        console.error("Error in viewState:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
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
        console.error("Error in createCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.updateCity = async(req,res,next)=>{
    try {
        const cityData = await services.cityUpdate(req);
        if(cityData){
            return res.status(200).json(Object.assign({status:cityData.success},cityData))
        }
    } catch (error) {
        console.error("Error in updateCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.deleteCity = async(req,res,next)=>{
    try {
        const cityData = await services.cityDelete(req);
        if(cityData){
            return res.status(200).json(Object.assign({status:cityData.success},{message:cityData.message}))
        }
    } catch (error) {
        console.error("Error in deleteCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.viewCity = async(req,res,next)=>{
    try {
        const ViewData = await services.cityView(req);
        if(ViewData){
            return res.status(200).json(Object.assign({ status: ViewData.success},ViewData ))
        } 
    } catch (error) {
        console.error("Error in viewCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};
