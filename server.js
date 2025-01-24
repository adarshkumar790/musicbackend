const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database Connection
mongoose
  .connect("mongodb://localhost:27017/movies", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("DB Connection Error:", err));

// Mongoose Schema
const movieSchema = new mongoose.Schema({
  title: String,
  image: String,
  link: String,
  createdBy: String,
});
const Movie = mongoose.model("Movie", movieSchema);

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Routes
app.get("/movies", async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

app.post("/movies", upload.single("image"), async (req, res) => {
  try {
    const { title, link, createdBy } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;
    const movie = new Movie({ title, image: imagePath, link, createdBy });
    await movie.save();
    res.json(movie);
  } catch (error) {
    console.error("Error saving movie:", error);
    res.status(500).json({ message: "Failed to add movie" });
  }
});

app.put("/movies/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, link, createdBy } = req.body;
    const updatedData = { title, link, createdBy };
    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }
    const movie = await Movie.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(movie);
  } catch (error) {
    console.error("Error updating movie:", error);
    res.status(500).json({ message: "Failed to update movie" });
  }
});

app.delete("/movies/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Movie deleted successfully" });
  } catch (error) {
    console.error("Error deleting movie:", error);
    res.status(500).json({ message: "Failed to delete movie" });
  }
});

// Start Server
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
