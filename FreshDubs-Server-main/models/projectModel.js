const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema(
  {
    projectName: { type: String, required: true },
    saveData: { type: mongoose.Schema.Types.Mixed },
    user_id: { type: mongoose.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

// projectSchema.statics.createProject = ({projectName, saveData}) =>{

// }

module.exports = mongoose.model("projectData", projectSchema, "projectData");
