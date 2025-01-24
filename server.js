const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve images statically

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
    cb(null, "uploads/"); // Save files in 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique file name
  },
});
const upload = multer({ storage });

// Movie Schema
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
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

// Add a new movie
app.post("/movies", upload.single("image"), async (req, res) => {
  try {
    const { title, link, createdBy } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;
    const newMovie = new Movie({ title, image: imagePath, link, createdBy });
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
    let updatedFields = { title, link, createdBy };
    if (req.file) {
      updatedFields.image = `/uploads/${req.file.filename}`;
    }
    const updatedMovie = await Movie.findByIdAndUpdate(id, updatedFields, { new: true });
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
    res.json({ success: true, message: "Movie deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete movie", error });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
