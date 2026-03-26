export const PUBLIC_SITE_SEED = {
  jashcharerp: {
    cms_url_alias: 'jashcharerp',
    is_frontend_enabled: true,

    // Header / footer settings used by PublicSchoolLayout components
    tagline: 'Learning. Growth. Community.',
    phone: '+91 90000 00000',
    email: 'info@jashcharerp.school',
    address: 'Sample Address, City, State, India',
    logo_url:
      'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=240&q=80&auto=format&fit=crop',

    // Shape matches useSchoolPublicData() select: cms_settings + nested schools
    schools: {
      id: 'seed-jashcharerp',
      name: 'Jashchar ERP Public School',
      address: 'Sample Address, City, State, India',
      contact_email: 'info@jashcharerp.school',
      contact_number: '+91 90000 00000',
      logo_url:
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=240&q=80&auto=format&fit=crop',
    },

    // Phase-1 static content (dummy text + royalty-free images)
    website_content: {
      meta: {
        siteTitle: 'Jashchar ERP School',
        defaultDescription:
          'Sample school public website (Phase 1) with editable structure and placeholders.',
      },
      homepage: {
        heroSlides: [
          {
            title: 'A Place To Learn And Grow',
            subtitle: 'A modern, student-first campus experience.',
            imageUrl:
              'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80&auto=format&fit=crop',
          },
          {
            title: 'Strong Academics, Strong Values',
            subtitle: 'Balanced curriculum + mentorship.',
            imageUrl:
              'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=80&auto=format&fit=crop',
          },
          {
            title: 'Sports, Arts & Activities',
            subtitle: 'All-round development for every learner.',
            imageUrl:
              'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1600&q=80&auto=format&fit=crop',
          },
        ],
        featureCards: [
          {
            title: 'Scholarship Facility',
            description: 'Sample placeholder describing the scholarship program.',
            icon: 'GraduationCap',
          },
          {
            title: 'Books & Library',
            description: 'Sample placeholder describing library resources.',
            icon: 'BookOpen',
          },
          {
            title: 'Certified Teachers',
            description: 'Sample placeholder describing trained educators.',
            icon: 'UserCheck',
          },
        ],
        about: {
          title: 'About Us',
          subtitle: 'A short introduction to the school and its mission.',
          imageUrl:
            'https://images.unsplash.com/photo-1588072432836-7fb78c5f1f8b?w=1000&q=80&auto=format&fit=crop',
          body: [
            'This is dummy content for Phase 1. Replace via Front-CMS in Phase 2.',
            'We focus on academics, co-curricular programs, and safe campus systems.',
          ],
          bullets: [
            'Well-structured curriculum',
            'Sports & co-curriculars',
            'Student support & mentoring',
          ],
        },
        academicsOverview: {
          title: 'Academics',
          subtitle: 'An overview of curriculum and learning tracks.',
          items: [
            {
              title: 'Pre Primary',
              description: 'Play-based learning and early skill development.',
              link: '/page/pre-primary',
            },
            {
              title: 'Primary',
              description: 'Foundational literacy, numeracy and curiosity.',
              link: '/page/course',
            },
            {
              title: 'Middle & Secondary',
              description: 'Subject depth, projects and exam readiness support.',
              link: '/page/course',
            },
          ],
        },
        facilitiesPreview: {
          title: 'Facilities',
          subtitle: 'Learning spaces designed for students.',
          items: [
            {
              title: 'Library',
              description: 'Reading corner and curated learning resources.',
              imageUrl:
                'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&q=80&auto=format&fit=crop',
            },
            {
              title: 'Science Labs',
              description: 'Hands-on experiments with safe lab practices.',
              imageUrl:
                'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900&q=80&auto=format&fit=crop',
            },
            {
              title: 'Sports',
              description: 'Indoor and outdoor sports and athletics training.',
              imageUrl:
                'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=900&q=80&auto=format&fit=crop',
            },
          ],
        },
        principalMessage: {
          title: 'Principal Message',
          name: 'Principal (Sample)',
          role: 'Principal',
          imageUrl:
            'https://images.unsplash.com/photo-1557862921-37829c790f19?w=600&q=80&auto=format&fit=crop',
          excerpt:
            'Welcome to our school community. In Phase 1, this is placeholder content that mirrors the layout of the reference website without copying text. In Phase 2, this section becomes editable in Front-CMS.',
          link: '/page/principal-message',
        },
        contactStrip: {
          title: 'Contact',
          subtitle: 'We are happy to help. Reach out any time.',
        },
      },
      pages: {
        'about-us': {
          title: 'About School',
          sections: [
            {
              heading: 'Our Mission',
              body:
                'Sample placeholder text describing mission and educational philosophy.',
            },
            {
              heading: 'Our Vision',
              body:
                'Sample placeholder text describing long-term vision and outcomes.',
            },
          ],
        },
        facilities: {
          title: 'Facilities',
          sections: [
            {
              heading: 'Library',
              body:
                'Sample placeholder describing reading spaces and learning resources.',
            },
            {
              heading: 'Science & Computer Labs',
              body:
                'Sample placeholder describing labs and practical learning support.',
            },
            {
              heading: 'Sports',
              body:
                'Sample placeholder describing indoor/outdoor sports facilities.',
            },
          ],
        },
        'annual-sports-day': {
          title: 'Annual Sports Day',
          sections: [
            {
              heading: 'Highlights',
              body:
                'Sample placeholder describing ceremonies, events, and participation.',
            },
          ],
        },
        course: {
          title: 'Course',
          sections: [
            {
              heading: 'Primary',
              body:
                'Sample placeholder describing foundational literacy and numeracy.',
            },
            {
              heading: 'Middle',
              body:
                'Sample placeholder describing subject depth and skill building.',
            },
            {
              heading: 'Secondary',
              body:
                'Sample placeholder describing board exam readiness and guidance.',
            },
          ],
        },
        'school-uniform': {
          title: 'School Uniform',
          sections: [
            {
              heading: 'Uniform Guidelines',
              body:
                'Sample placeholder describing uniform standards and discipline.',
            },
          ],
        },
        'principal-message': {
          title: 'Principal Message',
          sections: [
            {
              heading: 'A Note From The Principal',
              body:
                'Sample placeholder message with a warm, professional tone.',
            },
          ],
        },
        'school-management': {
          title: 'School Management',
          sections: [
            {
              heading: 'Management Committee',
              body:
                'Sample placeholder describing governance and administration.',
            },
          ],
        },
        'know-us': {
          title: 'Know Us',
          sections: [
            {
              heading: 'Who We Are',
              body:
                'Sample placeholder describing history, community, and achievements.',
            },
          ],
        },
        approach: {
          title: 'Approach',
          sections: [
            {
              heading: 'Teaching Methodology',
              body:
                'Sample placeholder describing learning frameworks and assessment.',
            },
          ],
        },
        'pre-primary': {
          title: 'Pre Primary',
          sections: [
            {
              heading: 'Early Learning',
              body:
                'Sample placeholder describing play-based and activity learning.',
            },
          ],
        },
        teacher: {
          title: 'Teacher',
          sections: [
            {
              heading: 'Our Faculty',
              body:
                'Sample placeholder describing faculty qualifications and training.',
            },
          ],
        },
        'houses-mentoring': {
          title: 'Houses & Mentoring',
          sections: [
            {
              heading: 'House System',
              body:
                'Sample placeholder describing values, leadership, and teamwork.',
            },
          ],
        },
        'student-council': {
          title: 'Student Council',
          sections: [
            {
              heading: 'Leadership',
              body:
                'Sample placeholder describing elections, roles, and initiatives.',
            },
          ],
        },
        'career-counselling': {
          title: 'Career Counselling',
          sections: [
            {
              heading: 'Guidance Program',
              body:
                'Sample placeholder describing streams, aptitude and mentorship.',
            },
          ],
        },
        gallery: {
          title: 'Gallery',
        },
        events: {
          title: 'Events',
        },
        news: {
          title: 'News',
        },
        'contact-us': {
          title: 'Contact Us',
        },
      },
      events: [
        {
          id: 'evt-001',
          title: 'Orientation Program',
          date: '2025-12-15',
          time: '10:00 AM',
          location: 'School Auditorium',
        },
        {
          id: 'evt-002',
          title: 'Science Exhibition',
          date: '2025-12-22',
          time: '11:30 AM',
          location: 'Main Campus Hall',
        },
      ],
      news: [
        {
          id: 'news-001',
          title: 'New Library Reading Corner Opened',
          date: '2025-12-10',
          summary:
            'Sample placeholder describing a campus update in a concise way.',
        },
        {
          id: 'news-002',
          title: 'Sports Team Training Schedule Updated',
          date: '2025-12-05',
          summary:
            'Sample placeholder describing schedule updates and participation.',
        },
      ],
      gallery: [
        {
          id: 'gal-001',
          title: 'Campus',
          imageUrl:
            'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80&auto=format&fit=crop',
        },
        {
          id: 'gal-002',
          title: 'Classroom',
          imageUrl:
            'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=80&auto=format&fit=crop',
        },
        {
          id: 'gal-003',
          title: 'Sports',
          imageUrl:
            'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=900&q=80&auto=format&fit=crop',
        },
        {
          id: 'gal-004',
          title: 'Activities',
          imageUrl:
            'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=900&q=80&auto=format&fit=crop',
        },
      ],
      testimonials: [
        {
          id: 't-001',
          name: 'Sample Parent',
          role: 'Parent',
          quote:
            'Sample placeholder testimonial about learning and school support.',
        },
        {
          id: 't-002',
          name: 'Sample Alumni',
          role: 'Alumni',
          quote:
            'Sample placeholder testimonial about activities and mentoring.',
        },
      ],
    },
  },
  ssvk: {
    cms_url_alias: 'ssvk',
    is_frontend_enabled: true,
    tagline: 'Excellence in Education',
    phone: '+91 98765 43210',
    email: 'contact@ssvk.edu',
    address: 'SSVK Campus, Bangalore',
    logo_url: 'https://via.placeholder.com/150',
    schools: {
      id: 'seed-ssvk',
      name: 'Sri Siddaganga Vidya Kendra',
      address: 'SSVK Campus, Bangalore',
      contact_email: 'contact@ssvk.edu',
      contact_number: '+91 98765 43210',
      logo_url: 'https://via.placeholder.com/150',
    },
    website_content: {
      meta: {
        siteTitle: 'Sri Siddaganga Vidya Kendra',
        defaultDescription: 'Welcome to SSVK',
      },
      homepage: {
        heroSlides: [
           {
            title: 'Welcome to SSVK',
            subtitle: 'Nurturing Future Leaders',
            imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80&auto=format&fit=crop',
          }
        ],
        featureCards: [],
        about: {
          title: 'About SSVK',
          subtitle: 'Tradition meets Technology',
          body: ['SSVK is committed to providing quality education.'],
          bullets: ['Holistic Development', 'Experienced Faculty']
        },
        academicsOverview: {
          title: 'Academics',
          subtitle: 'Our Programs',
          items: []
        },
        achievements: [],
        staff: [],
        news: [],
        events: [],
        gallery: [],
        testimonials: []
      }
    }
  }
};
