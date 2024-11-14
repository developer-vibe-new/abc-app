
// const stateModels = require('../../models/stateModel');
const {State} = require('../../models/stateModel');

exports.stateCrud = async(req,res,next)=>{
    try {
        console.log(req.body,"oooooooooooo")
        const state = new State({ state: req.body.state });
        const getState = await state.save();
        
        if(getState){
            return {
                success:true,
                message:"state added successfully"
            }
        }
    } catch (error) {
        console.log(error);
    }
};