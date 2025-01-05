const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String, required: true },
  });
  
  const Movie = mongoose.model("Movie", movieSchema);