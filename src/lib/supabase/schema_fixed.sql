-- Schema for Hackathon Signup Application

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  role TEXT,
  skills TEXT[],
  interests TEXT[],
  contact_info JSONB,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_admin BOOLEAN DEFAULT false
);

-- Create secure RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Hackathons table
CREATE TABLE IF NOT EXISTS hackathons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  team_formation_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  submission_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  judging_start TIMESTAMP WITH TIME ZONE NOT NULL,
  judging_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  max_team_size INTEGER DEFAULT 5 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create secure RLS policies for hackathons
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Hackathons are viewable by everyone" ON hackathons;
DROP POLICY IF EXISTS "Only admins can create hackathons" ON hackathons;
DROP POLICY IF EXISTS "Only admins can update hackathons" ON hackathons;
DROP POLICY IF EXISTS "Only admins can delete hackathons" ON hackathons;

CREATE POLICY "Hackathons are viewable by everyone" ON hackathons
  FOR SELECT USING (true);

CREATE POLICY "Only admins can create hackathons" ON hackathons
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Only admins can update hackathons" ON hackathons
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Only admins can delete hackathons" ON hackathons
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hackathon_id UUID REFERENCES hackathons ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  looking_for_members BOOLEAN DEFAULT true NOT NULL,
  needed_skills TEXT[],
  created_by UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(hackathon_id, name)
);

-- Create secure RLS policies for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Any user can create a team" ON teams;
DROP POLICY IF EXISTS "Only team creators can update teams" ON teams;
DROP POLICY IF EXISTS "Only team creators can delete teams" ON teams;

CREATE POLICY "Teams are viewable by everyone" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Any user can create a team" ON teams
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only team creators can update teams" ON teams
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Only team creators can delete teams" ON teams
  FOR DELETE USING (auth.uid() = created_by);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  role TEXT,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  is_leader BOOLEAN DEFAULT false NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Create secure RLS policies for team members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON team_members;
DROP POLICY IF EXISTS "Users can request to join teams" ON team_members;
DROP POLICY IF EXISTS "Team leaders can approve members" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams or team leaders can remove them" ON team_members;

CREATE POLICY "Team members are viewable by everyone" ON team_members
  FOR SELECT USING (true);

CREATE POLICY "Users can request to join teams" ON team_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    NOT EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t1 ON tm.team_id = t1.id
      JOIN teams t2 ON t2.id = team_members.team_id
      WHERE tm.user_id = auth.uid() 
        AND tm.is_approved = true
        AND t1.hackathon_id = t2.hackathon_id
    )
  );

CREATE POLICY "Team leaders can approve members" ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = team_members.team_id 
      AND user_id = auth.uid() 
      AND is_leader = true
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Users can leave teams or team leaders can remove them" ON team_members
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = team_members.team_id 
      AND user_id = auth.uid() 
      AND is_leader = true
    )
  );

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  technologies TEXT[],
  video_url TEXT,
  resources_url TEXT,
  is_submitted BOOLEAN DEFAULT false NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(team_id)
);

-- Create secure RLS policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON projects;
DROP POLICY IF EXISTS "Team members can create and update projects" ON projects;
DROP POLICY IF EXISTS "Team members can update their projects" ON projects;

CREATE POLICY "Projects are viewable by everyone" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Team members can create and update projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = projects.team_id 
      AND user_id = auth.uid()
      AND is_approved = true
    )
  );

CREATE POLICY "Team members can update their projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = projects.team_id 
      AND user_id = auth.uid()
      AND is_approved = true
    )
  );

-- Judging criteria table
CREATE TABLE IF NOT EXISTS judging_criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hackathon_id UUID REFERENCES hackathons ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  weight INTEGER DEFAULT 1 NOT NULL,
  max_score INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create secure RLS policies for judging criteria
ALTER TABLE judging_criteria ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Judging criteria are viewable by everyone" ON judging_criteria;
DROP POLICY IF EXISTS "Only admins can manage judging criteria" ON judging_criteria;

CREATE POLICY "Judging criteria are viewable by everyone" ON judging_criteria
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage judging criteria" ON judging_criteria
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Judges table
CREATE TABLE IF NOT EXISTS judges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hackathon_id UUID REFERENCES hackathons ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(hackathon_id, user_id)
);

-- Create secure RLS policies for judges
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Judges are viewable by everyone" ON judges;
DROP POLICY IF EXISTS "Only admins can manage judges" ON judges;

CREATE POLICY "Judges are viewable by everyone" ON judges
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage judges" ON judges
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Project scores table
CREATE TABLE IF NOT EXISTS project_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  judge_id UUID REFERENCES judges ON DELETE CASCADE NOT NULL,
  criteria_id UUID REFERENCES judging_criteria ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(project_id, judge_id, criteria_id)
);

-- Create secure RLS policies for project scores
ALTER TABLE project_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Scores are viewable by everyone after hackathon ends" ON project_scores;
DROP POLICY IF EXISTS "Judges can see their own scores" ON project_scores;
DROP POLICY IF EXISTS "Judges can score projects" ON project_scores;
DROP POLICY IF EXISTS "Judges can update their scores" ON project_scores;

CREATE POLICY "Scores are viewable by everyone after hackathon ends" ON project_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN teams t ON p.team_id = t.id
      JOIN hackathons h ON t.hackathon_id = h.id
      WHERE p.id = project_scores.project_id
      AND CURRENT_TIMESTAMP > h.judging_end
    )
  );

CREATE POLICY "Judges can see their own scores" ON project_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM judges
      WHERE id = project_scores.judge_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Judges can score projects" ON project_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM judges
      WHERE id = project_scores.judge_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Judges can update their scores" ON project_scores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM judges
      WHERE id = project_scores.judge_id
      AND user_id = auth.uid()
    )
  );

-- Create triggers to update updated_at columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_hackathons_updated_at ON hackathons;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_judging_criteria_updated_at ON judging_criteria;
DROP TRIGGER IF EXISTS update_project_scores_updated_at ON project_scores;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_hackathons_updated_at
BEFORE UPDATE ON hackathons
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_judging_criteria_updated_at
BEFORE UPDATE ON judging_criteria
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_project_scores_updated_at
BEFORE UPDATE ON project_scores
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create function for user management - skip the trigger for now
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skip creating the trigger as it already exists
-- The existing trigger will work with our new/updated function