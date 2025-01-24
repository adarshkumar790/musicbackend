const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded images statically

// MongoDB connection
mongoose
  .connect("mongodb+srv://AdarshKumar:7903848803@cluster0.bpglqqv.mongodb.net/movies", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir); // Create uploads directory if it doesn't exist
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Movie Schema
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true }, // Store the file path of the uploaded image
  link: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Movie = mongoose.model("Movie", movieSchema);

// Routes

// Get all movies
app.get("/movies", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch movies", error });
  }
});

// Add a new movie with image upload
app.post("/movies", upload.single("image"), async (req, res) => {
  try {
    const { title, link, createdBy } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newMovie = new Movie({ title, image, link, createdBy });
    await newMovie.save();
    res.json({ success: true, movie: newMovie });
  } catch (error) {
    res.status(500).json({ message: "Failed to add movie", error });
  }
});

// Update a movie
app.put("/movies/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link, createdBy } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updatedData = { title, link, createdBy };
    if (image) updatedData.image = image;

    const updatedMovie = await Movie.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updatedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.json({ success: true, movie: updatedMovie });
  } catch (error) {
    res.status(500).json({ message: "Failed to update movie", error });
  }
});

// Delete a movie
app.delete("/movies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMovie = await Movie.findByIdAndDelete(id);
    if (!deletedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Optionally delete the associated image file
    if (deletedMovie.image) {
      const imagePath = path.join(__dirname, deletedMovie.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ success: true, message: "Movie deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete movie", error });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
