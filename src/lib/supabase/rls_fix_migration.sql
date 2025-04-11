-- Safe migration to update RLS policy without affecting data
-- This script only updates the team_members RLS policy for joining teams
-- It first drops the existing policy and then creates the updated version

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can request to join teams" ON team_members;

-- Create the updated policy with a more efficient and accurate JOIN syntax
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

-- Verify the update by listing all RLS policies on the team_members table
-- SELECT * FROM pg_policies WHERE tablename = 'team_members';