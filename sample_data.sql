-- sample_data.sql
-- This file contains sample data for testing the hackathon judging capability
-- All data uses specific UUIDs to make it easier to delete later

-- Create a test hackathon with an upcoming judging period
INSERT INTO public.hackathons (
  id, 
  title, 
  description, 
  start_date, 
  end_date, 
  registration_deadline, 
  team_formation_deadline, 
  submission_deadline, 
  judging_start, 
  judging_end, 
  is_active, 
  max_team_size
) VALUES (
  '00000000-0000-4000-a000-000000000001'::uuid, -- Use a fixed UUID for easy deletion
  'Sample Hackathon 2025',
  'This is a sample hackathon created for testing the judging functionality. It includes pre-populated teams and projects.',
  CURRENT_DATE - INTERVAL '14 days', -- Started 14 days ago
  CURRENT_DATE + INTERVAL '14 days', -- Ends in 14 days
  CURRENT_DATE - INTERVAL '28 days', -- Registration deadline was 28 days ago
  CURRENT_DATE - INTERVAL '21 days', -- Team formation deadline was 21 days ago
  CURRENT_DATE - INTERVAL '2 days',  -- Submission deadline was 2 days ago
  CURRENT_DATE,                      -- Judging starts today
  CURRENT_DATE + INTERVAL '7 days',  -- Judging ends in 7 days
  true,                              -- Active hackathon
  5                                  -- Max team size
);

-- Add judging criteria for the sample hackathon
INSERT INTO public.judging_criteria (
  id, 
  hackathon_id, 
  name, 
  description, 
  weight, 
  max_score
) VALUES
-- Innovation criteria
(
  '00000000-0000-4000-a000-000000000101'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Innovation',
  'Originality of the idea and approach. How innovative is the solution?',
  3,
  10
),
-- Technical Implementation criteria
(
  '00000000-0000-4000-a000-000000000102'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Technical Implementation',
  'Quality of code, technical architecture, and overall implementation.',
  2,
  10
),
-- User Experience criteria
(
  '00000000-0000-4000-a000-000000000103'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'User Experience',
  'Usability, design, and overall user experience of the solution.',
  2,
  10
),
-- Impact criteria
(
  '00000000-0000-4000-a000-000000000104'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Impact',
  'Potential impact and value proposition of the solution.',
  3,
  10
);

-- Create sample teams for the hackathon
-- Note: These teams will be linked to actual users in the system

-- Function to get 3 random user IDs from the system
CREATE OR REPLACE FUNCTION get_sample_users() 
RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  ORDER BY random()
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- Create Team 1: Code Wizards
INSERT INTO public.teams (
  id, 
  hackathon_id, 
  name, 
  description, 
  looking_for_members, 
  needed_skills, 
  created_by
) 
WITH users AS (SELECT * FROM get_sample_users())
SELECT
  '00000000-0000-4000-a000-000000000201'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Code Wizards',
  'We create magical software solutions with clean code and innovative approaches.',
  false,
  ARRAY['JavaScript', 'React', 'Node.js', 'AI', 'UI/UX'],
  (SELECT id FROM users LIMIT 1);

-- Create Team 2: Data Dynamos
INSERT INTO public.teams (
  id, 
  hackathon_id, 
  name, 
  description, 
  looking_for_members, 
  needed_skills, 
  created_by
) 
WITH users AS (SELECT * FROM get_sample_users())
SELECT
  '00000000-0000-4000-a000-000000000202'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Data Dynamos',
  'Turning data into actionable insights through machine learning and analytics.',
  false,
  ARRAY['Python', 'Machine Learning', 'Data Science', 'Visualization', 'Statistics'],
  (SELECT id FROM users LIMIT 1);

-- Create Team 3: Mobile Mavericks
INSERT INTO public.teams (
  id, 
  hackathon_id, 
  name, 
  description, 
  looking_for_members, 
  needed_skills, 
  created_by
) 
WITH users AS (SELECT * FROM get_sample_users())
SELECT
  '00000000-0000-4000-a000-000000000203'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Mobile Mavericks',
  'Creating exceptional mobile experiences with cutting-edge technologies.',
  false,
  ARRAY['Swift', 'Kotlin', 'React Native', 'UX Design', 'Firebase'],
  (SELECT id FROM users LIMIT 1);

-- Create Team 4: Cloud Champions
INSERT INTO public.teams (
  id, 
  hackathon_id, 
  name, 
  description, 
  looking_for_members, 
  needed_skills, 
  created_by
) 
WITH users AS (SELECT * FROM get_sample_users())
SELECT
  '00000000-0000-4000-a000-000000000204'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Cloud Champions',
  'Building scalable, resilient solutions using modern cloud technologies.',
  false,
  ARRAY['AWS', 'Azure', 'Kubernetes', 'DevOps', 'Serverless'],
  (SELECT id FROM users LIMIT 1);

-- Create Team 5: Security Sentinels
INSERT INTO public.teams (
  id, 
  hackathon_id, 
  name, 
  description, 
  looking_for_members, 
  needed_skills, 
  created_by
) 
WITH users AS (SELECT * FROM get_sample_users())
SELECT
  '00000000-0000-4000-a000-000000000205'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Security Sentinels',
  'Protecting digital assets through innovative cybersecurity solutions.',
  false,
  ARRAY['Cybersecurity', 'Ethical Hacking', 'Blockchain', 'Cryptography', 'Zero Trust'],
  (SELECT id FROM users LIMIT 1);

-- Add team members
-- Function to add team members to each team
CREATE OR REPLACE FUNCTION add_team_members() RETURNS void AS $$
DECLARE
  team_id uuid;
  team_creator_id uuid;
  user_id uuid;
  user_cursor CURSOR FOR SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 15;
  team_cursor CURSOR FOR 
    SELECT t.id, t.created_by 
    FROM public.teams t 
    WHERE t.id::text LIKE '00000000-0000-4000-a000-00000000020%';
  member_count integer := 0;
  max_members integer := 3;
BEGIN
  -- For each team
  OPEN team_cursor;
  LOOP
    FETCH team_cursor INTO team_id, team_creator_id;
    EXIT WHEN NOT FOUND;
    
    -- Add creator as team leader
    INSERT INTO public.team_members (
      team_id, user_id, is_approved, is_leader
    ) VALUES (
      team_id, team_creator_id, true, true
    );
    
    -- Reset member count for this team
    member_count := 0;
    
    -- Add 2 more random members to the team
    OPEN user_cursor;
    LOOP
      FETCH user_cursor INTO user_id;
      EXIT WHEN NOT FOUND OR member_count >= max_members;
      
      -- Skip if this is the team creator
      CONTINUE WHEN user_id = team_creator_id;
      
      -- Add as regular member
      INSERT INTO public.team_members (
        team_id, user_id, is_approved, is_leader
      ) VALUES (
        team_id, user_id, true, false
      );
      
      member_count := member_count + 1;
    END LOOP;
    CLOSE user_cursor;
  END LOOP;
  CLOSE team_cursor;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to add team members
SELECT add_team_members();

-- Create projects for each team
-- Project 1: AI Tutor
INSERT INTO public.projects (
  id,
  team_id,
  title,
  description,
  category,
  technologies,
  video_url,
  resources_url,
  is_submitted,
  submission_date
) VALUES (
  '00000000-0000-4000-a000-000000000301'::uuid,
  '00000000-0000-4000-a000-000000000201'::uuid,
  'AI Tutor',
  'An AI-powered tutoring system that adapts to individual student learning styles and provides personalized educational content. The system uses natural language processing to understand student questions and provide tailored explanations and examples.',
  'Education',
  ARRAY['React', 'Node.js', 'TensorFlow', 'OpenAI', 'MongoDB'],
  'https://www.youtube.com/watch?v=example1',
  'https://github.com/example/ai-tutor',
  true,
  CURRENT_DATE - INTERVAL '3 days'
);

-- Project 2: Predictive Healthcare Analytics
INSERT INTO public.projects (
  id,
  team_id,
  title,
  description,
  category,
  technologies,
  video_url,
  resources_url,
  is_submitted,
  submission_date
) VALUES (
  '00000000-0000-4000-a000-000000000302'::uuid,
  '00000000-0000-4000-a000-000000000202'::uuid,
  'Predictive Healthcare Analytics',
  'A machine learning system that analyzes healthcare data to predict patient readmission risk. The platform integrates with electronic health records and provides actionable insights to healthcare providers to improve patient outcomes and reduce hospitalization rates.',
  'Healthcare',
  ARRAY['Python', 'PyTorch', 'Scikit-learn', 'PostgreSQL', 'Dash'],
  'https://www.youtube.com/watch?v=example2',
  'https://github.com/example/healthcare-analytics',
  true,
  CURRENT_DATE - INTERVAL '2 days'
);

-- Project 3: EcoTracker
INSERT INTO public.projects (
  id,
  team_id,
  title,
  description,
  category,
  technologies,
  video_url,
  resources_url,
  is_submitted,
  submission_date
) VALUES (
  '00000000-0000-4000-a000-000000000303'::uuid,
  '00000000-0000-4000-a000-000000000203'::uuid,
  'EcoTracker',
  'A mobile application that helps users track and reduce their carbon footprint. The app suggests personalized eco-friendly alternatives, connects users with sustainable businesses, and gamifies the experience of living more sustainably.',
  'Sustainability',
  ARRAY['React Native', 'Firebase', 'Swift', 'Kotlin', 'Google Maps API'],
  'https://www.youtube.com/watch?v=example3',
  'https://github.com/example/eco-tracker',
  true,
  CURRENT_DATE - INTERVAL '4 days'
);

-- Project 4: Disaster Response Platform
INSERT INTO public.projects (
  id,
  team_id,
  title,
  description,
  category,
  technologies,
  video_url,
  resources_url,
  is_submitted,
  submission_date
) VALUES (
  '00000000-0000-4000-a000-000000000304'::uuid,
  '00000000-0000-4000-a000-000000000204'::uuid,
  'Disaster Response Platform',
  'A cloud-based platform that coordinates disaster response efforts by connecting affected communities with aid organizations. The system uses real-time data processing to allocate resources efficiently and prioritize critical needs during emergencies.',
  'Social Impact',
  ARRAY['AWS Lambda', 'DynamoDB', 'Kubernetes', 'React', 'Elasticsearch'],
  'https://www.youtube.com/watch?v=example4',
  'https://github.com/example/disaster-response',
  true,
  CURRENT_DATE - INTERVAL '2 days'
);

-- Project 5: Secure Health Records
INSERT INTO public.projects (
  id,
  team_id,
  title,
  description,
  category,
  technologies,
  video_url,
  resources_url,
  is_submitted,
  submission_date
) VALUES (
  '00000000-0000-4000-a000-000000000305'::uuid,
  '00000000-0000-4000-a000-000000000205'::uuid,
  'Secure Health Records',
  'A blockchain-based system for securely storing and sharing patient health records. The platform gives patients complete control over their health data while allowing authorized healthcare providers to access necessary information with patient consent.',
  'Healthcare',
  ARRAY['Solidity', 'Ethereum', 'React', 'Node.js', 'IPFS'],
  'https://www.youtube.com/watch?v=example5',
  'https://github.com/example/secure-health-records',
  true,
  CURRENT_DATE - INTERVAL '3 days'
);

-- Add sample judges for the hackathon
CREATE OR REPLACE FUNCTION add_sample_judges() RETURNS void AS $$
DECLARE
  hackathon_id uuid := '00000000-0000-4000-a000-000000000001'::uuid;
  user_id uuid;
  user_cursor CURSOR FOR SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 3;
  judge_count integer := 0;
BEGIN
  OPEN user_cursor;
  LOOP
    FETCH user_cursor INTO user_id;
    EXIT WHEN NOT FOUND;
    
    -- Add user as judge
    INSERT INTO public.judges (
      id, hackathon_id, user_id
    ) VALUES (
      (CASE 
        WHEN judge_count = 0 THEN '00000000-0000-4000-a000-000000000401'::uuid
        WHEN judge_count = 1 THEN '00000000-0000-4000-a000-000000000402'::uuid 
        ELSE '00000000-0000-4000-a000-000000000403'::uuid
       END),
      hackathon_id,
      user_id
    );
    
    judge_count := judge_count + 1;
  END LOOP;
  CLOSE user_cursor;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to add judges
SELECT add_sample_judges();

-- Clean up temporary functions
DROP FUNCTION IF EXISTS get_sample_users();
DROP FUNCTION IF EXISTS add_team_members();
DROP FUNCTION IF EXISTS add_sample_judges();

-- Create a cleanup script
CREATE OR REPLACE FUNCTION cleanup_sample_data() RETURNS void AS $$
BEGIN
  -- Delete projects
  DELETE FROM public.projects WHERE id::text LIKE '00000000-0000-4000-a000-00000000030%';
  
  -- Delete team members (automatically handled by foreign key constraints)
  
  -- Delete teams
  DELETE FROM public.teams WHERE id::text LIKE '00000000-0000-4000-a000-00000000020%';
  
  -- Delete judging criteria
  DELETE FROM public.judging_criteria WHERE id::text LIKE '00000000-0000-4000-a000-00000000010%';
  
  -- Delete judges
  DELETE FROM public.judges WHERE id::text LIKE '00000000-0000-4000-a000-00000000040%';
  
  -- Delete hackathon
  DELETE FROM public.hackathons WHERE id = '00000000-0000-4000-a000-000000000001'::uuid;
  
  -- Cleanup this function itself
  DROP FUNCTION IF EXISTS cleanup_sample_data();
END;
$$ LANGUAGE plpgsql;

-- Example of how to use the cleanup function:
-- SELECT cleanup_sample_data();