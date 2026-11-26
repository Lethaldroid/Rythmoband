const express = require("express");
const tryCatch = require("../utils/tryCatch");
const router = express.Router();
const ProjectModel = require("../models/projectModel");
const passport = require("passport");

const getProject = async (req, res) => {
  if (req.user) {
    const project = await ProjectModel.findById(req.query.id);
    res.status(200).json(project);
  } else {
    res.redirect("/login");
  }
};

const getAllProjects = async (req, res) => {
  if (req.user) {
    const projects = await ProjectModel.find({ user_id: req.user._id });
    res.status(200).json(projects);
  } else {
    res.redirect("/login");
  }
};

//you're here, then do a create project endpoint
const updateProject = async (req, res) => {
  const { projectName, saveData, id } = req.body;
  console.log(req.body);
  if (req.user) {
    if (id) {
      console.log("existing project");
      const project = await ProjectModel.findByIdAndUpdate(
        id,
        {
          projectName,
          saveData,
        },
        { upsert: true, new: true }
      );
      res.status(200).json(project);
    } else {
      const project = await ProjectModel.create({
        projectName,
        saveData,
        user_id: req.user._id,
      });
      //   console.log(id);
      res.status(200).json(project);
    }
  } else {
    res.redirect("/login");
  }
};
// const createProject = async (req, res) => {
//     const { projectName, saveData } = req.body;
//     if (req.user) {
//       const project = await ProjectModel.create({
//         projectName,
//         saveData,
//       });
//       res.status(200).json(project);
//     } else {
//       res.redirect("/login");
//     }
//   };
const deleteProject = async (req, res) => {
  if (req.user) {
    // console.log(req.query.id);
    const project = await ProjectModel.findByIdAndDelete({
      _id: req.query.id,
    });
    res.status(200).json(project);
  } else {
    res.redirect("/login");
  }
};
//get project data
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  tryCatch(getProject)
);

//get all projects
router.get(
  "/all",
  passport.authenticate("jwt", { session: false }),
  tryCatch(getAllProjects)
);

//save project
router.put(
  "/save",
  passport.authenticate("jwt", { session: false }),
  tryCatch(updateProject)
);

//delete project
router.delete(
  "/delete",
  passport.authenticate("jwt", { session: false }),
  tryCatch(deleteProject)
);

module.exports = router;
