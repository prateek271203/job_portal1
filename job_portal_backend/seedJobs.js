const mongoose = require('mongoose');
const Job = require('./models/Job');
require('dotenv').config();

const sampleJobs = [
  {
    title: 'Senior Software Engineer',
    company: 'Tech Solutions Inc.',
    description: 'We are looking for a talented Senior Software Engineer to join our team. You will be responsible for developing high-quality software solutions, mentoring junior developers, and collaborating with cross-functional teams to deliver innovative products.',
    requirements: [
      '5+ years of experience in software development',
      'Strong knowledge of JavaScript, Python, or Java',
      'Experience with modern frameworks like React, Node.js, or Django',
      'Understanding of database design and SQL',
      'Experience with cloud platforms (AWS, Azure, or GCP)'
    ],
    responsibilities: [
      'Design and implement scalable software solutions',
      'Write clean, maintainable, and efficient code',
      'Collaborate with product managers and designers',
      'Mentor junior developers and conduct code reviews',
      'Participate in agile development processes'
    ],
    category: 'Technology',
    jobType: 'Full time',
    experience: 'Senior Level',
    location: 'New York, NY',
    salaryRange: '$80,000 - $120,000',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
    tags: ['Software Development', 'Full Stack', 'React', 'Node.js'],
    benefits: ['Health Insurance', '401k', 'Remote Work', 'Professional Development'],
    education: 'Bachelor',
    isFeatured: true,
    isActive: true
  },
  {
    title: 'Marketing Manager',
    company: 'Digital Marketing Pro',
    description: 'Join our dynamic marketing team as a Marketing Manager. You will be responsible for developing and executing marketing strategies, managing campaigns, and driving brand awareness across multiple channels.',
    requirements: [
      '3+ years of experience in digital marketing',
      'Experience with social media marketing and PPC campaigns',
      'Knowledge of marketing automation tools',
      'Strong analytical and communication skills',
      'Experience with Google Analytics and other marketing tools'
    ],
    responsibilities: [
      'Develop and execute marketing strategies',
      'Manage social media presence and campaigns',
      'Analyze campaign performance and optimize ROI',
      'Collaborate with creative and content teams',
      'Monitor market trends and competitor activities'
    ],
    category: 'Marketing',
    jobType: 'Full time',
    experience: 'Mid Level',
    location: 'Los Angeles, CA',
    salaryRange: '$60,000 - $80,000',
    skills: ['Digital Marketing', 'Social Media', 'PPC', 'Google Analytics', 'Content Marketing'],
    tags: ['Marketing', 'Digital', 'Social Media', 'PPC'],
    benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Performance Bonus'],
    education: 'Bachelor',
    isFeatured: false,
    isActive: true
  },
  {
    title: 'UX/UI Designer',
    company: 'Creative Design Studio',
    description: 'We are seeking a talented UX/UI Designer to create beautiful and functional user experiences. You will work closely with product teams to design intuitive interfaces that delight users.',
    requirements: [
      '2+ years of experience in UX/UI design',
      'Proficiency in design tools like Figma, Sketch, or Adobe XD',
      'Understanding of user-centered design principles',
      'Experience with prototyping and user testing',
      'Portfolio showcasing your design work'
    ],
    responsibilities: [
      'Create user-centered design solutions',
      'Design wireframes, prototypes, and high-fidelity mockups',
      'Conduct user research and usability testing',
      'Collaborate with developers and product managers',
      'Maintain design systems and style guides'
    ],
    category: 'Technology',
    jobType: 'Full time',
    experience: 'Mid Level',
    location: 'San Francisco, CA',
    salaryRange: '$70,000 - $90,000',
    skills: ['UX Design', 'UI Design', 'Figma', 'Prototyping', 'User Research', 'Design Systems'],
    tags: ['Design', 'UX/UI', 'User Experience', 'Interface Design'],
    benefits: ['Health Insurance', 'Flexible Work Hours', 'Creative Environment', 'Professional Tools'],
    education: 'Bachelor',
    isFeatured: true,
    isActive: true
  },
  {
    title: 'Data Scientist',
    company: 'Analytics Corp',
    description: 'Join our data science team to extract insights from complex datasets and build predictive models. You will work on cutting-edge machine learning projects and help drive data-driven decisions.',
    requirements: [
      '4+ years of experience in data science or analytics',
      'Strong programming skills in Python or R',
      'Experience with machine learning algorithms and libraries',
      'Knowledge of statistics and mathematical modeling',
      'Experience with big data technologies (Hadoop, Spark)'
    ],
    responsibilities: [
      'Develop and implement machine learning models',
      'Analyze large datasets to extract insights',
      'Create data visualizations and reports',
      'Collaborate with business teams to understand requirements',
      'Stay updated with latest data science trends and techniques'
    ],
    category: 'Technology',
    jobType: 'Full time',
    experience: 'Senior Level',
    location: 'Boston, MA',
    salaryRange: '$90,000 - $130,000',
    skills: ['Python', 'Machine Learning', 'Statistics', 'Data Visualization', 'SQL', 'Deep Learning'],
    tags: ['Data Science', 'Machine Learning', 'Analytics', 'Python'],
    benefits: ['Health Insurance', '401k', 'Remote Work', 'Conference Attendance'],
    education: 'Master',
    isFeatured: true,
    isActive: true
  },
  {
    title: 'Sales Representative',
    company: 'Global Sales Solutions',
    description: 'We are looking for motivated sales representatives to join our growing team. You will be responsible for generating new business opportunities and building strong customer relationships.',
    requirements: [
      '1+ years of experience in sales or customer service',
      'Excellent communication and interpersonal skills',
      'Ability to work in a fast-paced environment',
      'Strong negotiation and closing skills',
      'Experience with CRM systems (Salesforce preferred)'
    ],
    responsibilities: [
      'Generate new business opportunities through prospecting',
      'Build and maintain customer relationships',
      'Present product demonstrations and proposals',
      'Negotiate contracts and close sales',
      'Meet and exceed sales targets'
    ],
    category: 'Commerce',
    jobType: 'Full time',
    experience: 'Entry Level',
    location: 'Chicago, IL',
    salaryRange: '$40,000 - $60,000 + Commission',
    skills: ['Sales', 'Customer Relationship Management', 'Negotiation', 'Communication', 'CRM'],
    tags: ['Sales', 'Business Development', 'Customer Relations', 'B2B'],
    benefits: ['Commission Structure', 'Health Insurance', 'Training Programs', 'Career Growth'],
    education: 'High School',
    isFeatured: false,
    isActive: true
  },
  {
    title: 'Content Writer',
    company: 'Content Creation Hub',
    description: 'Join our content team to create engaging and informative content for various platforms. You will write blog posts, articles, and marketing copy that resonates with our target audience.',
    requirements: [
      '2+ years of experience in content writing or journalism',
      'Excellent writing and editing skills',
      'Understanding of SEO principles',
      'Ability to research and write on various topics',
      'Experience with content management systems'
    ],
    responsibilities: [
      'Write engaging blog posts and articles',
      'Create marketing copy for various campaigns',
      'Optimize content for SEO',
      'Collaborate with marketing and design teams',
      'Maintain content calendar and deadlines'
    ],
    category: 'Media',
    jobType: 'Part time',
    experience: 'Mid Level',
    location: 'Remote',
    salaryRange: '$30,000 - $45,000',
    skills: ['Content Writing', 'SEO', 'Copywriting', 'Research', 'Editing', 'WordPress'],
    tags: ['Content Writing', 'SEO', 'Digital Marketing', 'Blogging'],
    benefits: ['Flexible Hours', 'Remote Work', 'Creative Freedom', 'Professional Development'],
    education: 'Bachelor',
    isFeatured: false,
    isActive: true
  }
];

const seedJobs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job_portal');
    console.log('Connected to MongoDB');

    // Clear existing jobs
    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    // Insert sample jobs
    const createdJobs = await Job.insertMany(sampleJobs);
    console.log(`Successfully created ${createdJobs.length} sample jobs`);

    // Display created jobs
    createdJobs.forEach(job => {
      console.log(`- ${job.title} at ${job.company} (${job.location})`);
    });

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
};

// Run the seed function
seedJobs();
