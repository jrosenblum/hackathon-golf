# RLS Policy Migration Guide

This guide explains how to safely update the Row-Level Security (RLS) policy for the `team_members` table to fix the "violates row-level security policy" error when users try to join teams.

## Background

The current RLS policy for the `team_members` table has a complex subquery that is causing issues. The updated policy uses a more efficient JOIN syntax to achieve the same goal: preventing users from joining multiple teams in the same hackathon.

## Migration Steps

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the content of the `rls_fix_migration.sql` file
4. Run the SQL script
5. No data will be affected - only the permission policy is updated

## What This Changes

The policy "Users can request to join teams" is updated to:
- Use more efficient JOIN syntax
- Maintain the same security constraints (users can't join multiple teams in one hackathon)
- Make the SQL more readable and maintainable

## Safety

This migration is safe and:
- Does NOT delete or modify any existing data
- Only changes how permissions are checked
- Can be run during production without downtime
- Has been tested to ensure it correctly enforces the one-team-per-hackathon rule

## Verification

After running the migration, you can verify it worked by running this SQL in the Supabase SQL Editor:

```sql
SELECT * FROM pg_policies WHERE tablename = 'team_members';
```

You should see the updated policy listed.