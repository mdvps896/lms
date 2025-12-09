// Run this in MongoDB Compass or mongosh to check question structure

// Check one question to see its structure
db.questions.findOne({}, {
    _id: 1,
    questionText: 1,
    questionGroup: 1,
    subject: 1,
    category: 1,
    options: 1
})

// Count total questions
db.questions.countDocuments()

// Check if questions have questionGroup field
db.questions.countDocuments({ questionGroup: { $exists: true } })

// Get sample exam with question groups
db.exams.findOne({ name: "mah exam" }, {
    name: 1,
    questionGroups: 1,
    "attempts._id": 1
})
