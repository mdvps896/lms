// Script to seed courses from God of Graphics website
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

// Course Schema
const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    price: Number,
    discountedPrice: Number,
    thumbnail: String,
    instructor: String,
    duration: Object,
    level: String,
    language: String,
    curriculum: Array,
    features: Array,
    requirements: Array,
    whatYouWillLearn: Array,
    isActive: Boolean,
    createdAt: Date,
}, { strict: false });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

async function seedCourses() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing courses
        await Course.deleteMany({});
        console.log('🗑️  Cleared existing courses');

        const courses = [
            {
                title: "Advanced Graphic Design Course",
                description: "Master the art of graphic design with industry-standard tools and techniques. Learn Adobe Photoshop, Illustrator, CorelDRAW, and more. Perfect for beginners and professionals looking to enhance their skills.",
                category: "Graphic Design",
                price: 15000,
                discountedPrice: 12000,
                thumbnail: "https://godofgraphics.in/wp-content/uploads/2023/01/graphic-design-course.jpg",
                instructor: "God of Graphics Team",
                duration: { value: 6, unit: "months" },
                level: "Beginner to Advanced",
                language: "Hindi & English",
                curriculum: [
                    {
                        title: "Introduction to Graphic Design",
                        topics: [
                            { title: "Design Fundamentals", duration: "2 hours", type: "video" },
                            { title: "Color Theory", duration: "1.5 hours", type: "video" },
                            { title: "Typography Basics", duration: "2 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Adobe Photoshop Mastery",
                        topics: [
                            { title: "Interface and Tools", duration: "3 hours", type: "video" },
                            { title: "Photo Manipulation", duration: "4 hours", type: "video" },
                            { title: "Advanced Techniques", duration: "5 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Adobe Illustrator",
                        topics: [
                            { title: "Vector Graphics Basics", duration: "3 hours", type: "video" },
                            { title: "Logo Design", duration: "4 hours", type: "video" },
                            { title: "Illustration Techniques", duration: "5 hours", type: "video" }
                        ]
                    }
                ],
                features: [
                    "Live Online Classes",
                    "Recorded Sessions",
                    "Industry Projects",
                    "Certificate of Completion",
                    "Lifetime Access",
                    "Job Assistance"
                ],
                requirements: [
                    "Basic computer knowledge",
                    "Laptop/Desktop with 8GB RAM",
                    "Internet connection",
                    "Passion for design"
                ],
                whatYouWillLearn: [
                    "Master Adobe Photoshop, Illustrator, and CorelDRAW",
                    "Create professional logos and branding materials",
                    "Design social media graphics and advertisements",
                    "Understand color theory and typography",
                    "Build a professional portfolio"
                ],
                isActive: true,
                createdAt: new Date()
            },
            {
                title: "Video Editing Mastery Course",
                description: "Learn professional video editing with Adobe Premiere Pro, After Effects, and DaVinci Resolve. Create stunning videos for YouTube, social media, and professional projects.",
                category: "Video Editing",
                price: 18000,
                discountedPrice: 14000,
                thumbnail: "https://godofgraphics.in/wp-content/uploads/2023/01/video-editing-course.jpg",
                instructor: "God of Graphics Team",
                duration: { value: 6, unit: "months" },
                level: "Beginner to Advanced",
                language: "Hindi & English",
                curriculum: [
                    {
                        title: "Video Editing Fundamentals",
                        topics: [
                            { title: "Introduction to Video Editing", duration: "2 hours", type: "video" },
                            { title: "Timeline and Workflow", duration: "3 hours", type: "video" },
                            { title: "Cutting and Trimming", duration: "2 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Adobe Premiere Pro",
                        topics: [
                            { title: "Interface and Tools", duration: "3 hours", type: "video" },
                            { title: "Color Grading", duration: "4 hours", type: "video" },
                            { title: "Audio Editing", duration: "3 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Motion Graphics with After Effects",
                        topics: [
                            { title: "Animation Basics", duration: "4 hours", type: "video" },
                            { title: "Visual Effects", duration: "5 hours", type: "video" },
                            { title: "Title Animations", duration: "3 hours", type: "video" }
                        ]
                    }
                ],
                features: [
                    "Live Online Classes",
                    "Project-Based Learning",
                    "Industry-Standard Software",
                    "Certificate of Completion",
                    "Portfolio Development",
                    "Career Guidance"
                ],
                requirements: [
                    "Basic computer skills",
                    "Computer with 16GB RAM recommended",
                    "Good internet connection",
                    "Creative mindset"
                ],
                whatYouWillLearn: [
                    "Master Adobe Premiere Pro and After Effects",
                    "Create professional YouTube videos",
                    "Add motion graphics and visual effects",
                    "Color grade like a pro",
                    "Edit wedding videos and commercials"
                ],
                isActive: true,
                createdAt: new Date()
            },
            {
                title: "Professional 2D Animation Course",
                description: "Bring your characters to life with professional 2D animation techniques. Learn Adobe Animate, Toon Boom, and character design from industry experts.",
                category: "Animation",
                price: 20000,
                discountedPrice: 16000,
                thumbnail: "https://godofgraphics.in/wp-content/uploads/2023/01/2d-animation-course.jpg",
                instructor: "God of Graphics Team",
                duration: { value: 8, unit: "months" },
                level: "Intermediate to Advanced",
                language: "Hindi & English",
                curriculum: [
                    {
                        title: "Animation Principles",
                        topics: [
                            { title: "12 Principles of Animation", duration: "3 hours", type: "video" },
                            { title: "Timing and Spacing", duration: "2 hours", type: "video" },
                            { title: "Character Movement", duration: "4 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Character Design",
                        topics: [
                            { title: "Character Sketching", duration: "3 hours", type: "video" },
                            { title: "Digital Character Design", duration: "4 hours", type: "video" },
                            { title: "Character Rigging", duration: "5 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Adobe Animate & Toon Boom",
                        topics: [
                            { title: "Software Basics", duration: "3 hours", type: "video" },
                            { title: "Frame-by-Frame Animation", duration: "6 hours", type: "video" },
                            { title: "Lip Sync and Expressions", duration: "4 hours", type: "video" }
                        ]
                    }
                ],
                features: [
                    "Live Interactive Sessions",
                    "Character Design Projects",
                    "Animation Showreel Creation",
                    "Industry Certification",
                    "Placement Support",
                    "Mentorship Program"
                ],
                requirements: [
                    "Drawing skills (basic)",
                    "Graphics tablet recommended",
                    "Computer with good specifications",
                    "Dedication and patience"
                ],
                whatYouWillLearn: [
                    "Master 2D animation principles",
                    "Create animated characters",
                    "Design professional storyboards",
                    "Animate for TV and web series",
                    "Build animation portfolio"
                ],
                isActive: true,
                createdAt: new Date()
            },
            {
                title: "Master Motion Graphics Course",
                description: "Create stunning motion graphics and visual effects for commercials, explainer videos, and social media. Master After Effects, Cinema 4D, and more.",
                category: "Motion Graphics",
                price: 22000,
                discountedPrice: 18000,
                thumbnail: "https://godofgraphics.in/wp-content/uploads/2023/01/motion-graphics-course.jpg",
                instructor: "God of Graphics Team",
                duration: { value: 7, unit: "months" },
                level: "Intermediate to Advanced",
                language: "Hindi & English",
                curriculum: [
                    {
                        title: "Motion Graphics Fundamentals",
                        topics: [
                            { title: "Introduction to Motion Design", duration: "2 hours", type: "video" },
                            { title: "Design Principles for Motion", duration: "3 hours", type: "video" },
                            { title: "Storyboarding", duration: "2 hours", type: "video" }
                        ]
                    },
                    {
                        title: "After Effects Advanced",
                        topics: [
                            { title: "Expressions and Scripting", duration: "4 hours", type: "video" },
                            { title: "3D Layers and Camera", duration: "5 hours", type: "video" },
                            { title: "Particle Systems", duration: "4 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Cinema 4D Integration",
                        topics: [
                            { title: "3D Modeling Basics", duration: "5 hours", type: "video" },
                            { title: "Lighting and Rendering", duration: "4 hours", type: "video" },
                            { title: "C4D to After Effects Workflow", duration: "3 hours", type: "video" }
                        ]
                    }
                ],
                features: [
                    "Advanced Software Training",
                    "Commercial Projects",
                    "Showreel Development",
                    "Professional Certificate",
                    "Industry Networking",
                    "Freelance Guidance"
                ],
                requirements: [
                    "Basic After Effects knowledge",
                    "High-performance computer",
                    "Creative thinking",
                    "Time commitment"
                ],
                whatYouWillLearn: [
                    "Create professional motion graphics",
                    "Master After Effects and Cinema 4D",
                    "Design explainer videos",
                    "Create broadcast graphics",
                    "Build motion design portfolio"
                ],
                isActive: true,
                createdAt: new Date()
            },
            {
                title: "VFX and 3D Modeling Course",
                description: "Enter the world of visual effects and 3D modeling. Learn industry-standard tools like Maya, Blender, Nuke, and create Hollywood-style VFX.",
                category: "VFX & 3D",
                price: 25000,
                discountedPrice: 20000,
                thumbnail: "https://godofgraphics.in/wp-content/uploads/2023/01/vfx-3d-course.jpg",
                instructor: "God of Graphics Team",
                duration: { value: 10, unit: "months" },
                level: "Advanced",
                language: "Hindi & English",
                curriculum: [
                    {
                        title: "3D Modeling Fundamentals",
                        topics: [
                            { title: "Introduction to 3D", duration: "3 hours", type: "video" },
                            { title: "Polygon Modeling", duration: "5 hours", type: "video" },
                            { title: "UV Mapping and Texturing", duration: "4 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Character Modeling and Rigging",
                        topics: [
                            { title: "Character Anatomy", duration: "4 hours", type: "video" },
                            { title: "Advanced Modeling", duration: "6 hours", type: "video" },
                            { title: "Rigging and Skinning", duration: "5 hours", type: "video" }
                        ]
                    },
                    {
                        title: "Visual Effects with Nuke",
                        topics: [
                            { title: "Compositing Basics", duration: "4 hours", type: "video" },
                            { title: "Green Screen Keying", duration: "5 hours", type: "video" },
                            { title: "Particle Effects", duration: "6 hours", type: "video" }
                        ]
                    }
                ],
                features: [
                    "Industry-Standard Software",
                    "VFX Project Work",
                    "Demo Reel Creation",
                    "Professional Certification",
                    "Studio Placement Support",
                    "Expert Mentorship"
                ],
                requirements: [
                    "Strong computer skills",
                    "Workstation-class computer",
                    "Artistic vision",
                    "Commitment to learning"
                ],
                whatYouWillLearn: [
                    "Master Maya, Blender, and Nuke",
                    "Create 3D models and characters",
                    "Compose visual effects shots",
                    "Work on film-quality projects",
                    "Build professional VFX portfolio"
                ],
                isActive: true,
                createdAt: new Date()
            }
        ];

        // Insert courses
        const result = await Course.insertMany(courses);
        console.log(`✅ Successfully seeded ${result.length} courses!`);

        console.log('\n📚 Courses Created:');
        result.forEach((course, index) => {
            console.log(`${index + 1}. ${course.title}`);
            console.log(`   Category: ${course.category}`);
            console.log(`   Price: ₹${course.price} (Discounted: ₹${course.discountedPrice})`);
            console.log(`   Duration: ${course.duration.value} ${course.duration.unit}`);
            console.log('');
        });

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding courses:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
seedCourses();
