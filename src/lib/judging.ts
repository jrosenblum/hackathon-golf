/**
 * Default judging criteria for hackathons
 */
export const DEFAULT_JUDGING_CRITERIA = [
  {
    name: 'Innovation',
    description: 'Originality of the idea and approach. How innovative is the solution?',
    weight: 3,
    max_score: 10
  },
  {
    name: 'Technical Implementation',
    description: 'Quality of code, technical architecture, and overall implementation.',
    weight: 2,
    max_score: 10
  },
  {
    name: 'User Experience',
    description: 'Usability, design, and overall user experience of the solution.',
    weight: 2,
    max_score: 10
  },
  {
    name: 'Impact',
    description: 'Potential impact and value proposition of the solution.',
    weight: 3,
    max_score: 10
  }
];

/**
 * Add default judging criteria to a hackathon
 * @param supabase Supabase client instance
 * @param hackathonId ID of the hackathon to add criteria to
 * @returns Promise that resolves when all criteria have been added
 */
export async function addDefaultCriteriaToHackathon(supabase: any, hackathonId: string) {
  try {
    // Check if the hackathon already has criteria
    const { data: existingCriteria, error: checkError } = await supabase
      .from('judging_criteria')
      .select('id')
      .eq('hackathon_id', hackathonId);
    
    if (checkError) {
      console.error('Error checking existing criteria:', checkError);
      throw checkError;
    }
    
    // Only add default criteria if none exist
    if (existingCriteria && existingCriteria.length === 0) {
      // Prepare criteria objects with hackathon ID
      const criteriaToInsert = DEFAULT_JUDGING_CRITERIA.map(criteria => ({
        ...criteria,
        hackathon_id: hackathonId
      }));
      
      // Insert all default criteria
      const { error: insertError } = await supabase
        .from('judging_criteria')
        .insert(criteriaToInsert);
      
      if (insertError) {
        console.error('Error adding default criteria:', insertError);
        throw insertError;
      }
      
      return { success: true, message: 'Default judging criteria added' };
    }
    
    return { success: true, message: 'Hackathon already has judging criteria' };
  } catch (error) {
    console.error('Error in addDefaultCriteriaToHackathon:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

/**
 * Interface for a scored project
 */
export interface ProjectScore {
  projectId: string;
  projectTitle: string;
  teamId: string;
  teamName: string;
  averageScore: number;
  weightedScore: number;
  criteriaScores: {
    [criteriaId: string]: {
      name: string;
      weight: number;
      averageScore: number;
      weightedScore: number;
    }
  };
  judgeCount: number;
}

/**
 * Calculate scores for all projects in a hackathon
 * @param supabase Supabase client instance
 * @param hackathonId ID of the hackathon to calculate scores for
 * @returns Promise that resolves with the calculated scores
 */
export async function calculateProjectScores(supabase: any, hackathonId: string): Promise<ProjectScore[]> {
  try {
    // Fetch all judging criteria for this hackathon
    const { data: criteria, error: criteriaError } = await supabase
      .from('judging_criteria')
      .select('id, name, weight, max_score')
      .eq('hackathon_id', hackathonId);
    
    if (criteriaError) {
      console.error('Error fetching criteria:', criteriaError);
      throw criteriaError;
    }
    
    // Create a criteria map for easy access
    const criteriaMap = new Map();
    criteria.forEach((criterion: any) => {
      criteriaMap.set(criterion.id, criterion);
    });
    
    // Fetch all submitted projects for this hackathon
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        team_id,
        teams!inner (
          id,
          name,
          hackathon_id
        )
      `)
      .eq('teams.hackathon_id', hackathonId)
      .eq('is_submitted', true);
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }
    
    // Fetch all scores for all projects
    const { data: scores, error: scoresError } = await supabase
      .from('project_scores')
      .select(`
        id,
        project_id,
        judge_id,
        criteria_id,
        score
      `)
      .in('project_id', projects.map((p: any) => p.id));
    
    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      throw scoresError;
    }
    
    // Group scores by project ID
    const scoresByProject: Record<string, any[]> = {};
    scores.forEach((score: any) => {
      if (!scoresByProject[score.project_id]) {
        scoresByProject[score.project_id] = [];
      }
      scoresByProject[score.project_id].push(score);
    });
    
    // Calculate scores for each project
    const projectScores: ProjectScore[] = projects.map((project: any) => {
      const projectId = project.id;
      const projectScores = scoresByProject[projectId] || [];
      
      // Count unique judges
      const judgeIds = new Set();
      projectScores.forEach((score: any) => {
        judgeIds.add(score.judge_id);
      });
      const judgeCount = judgeIds.size;
      
      // Group scores by criteria
      const scoresByCriteria: Record<string, number[]> = {};
      projectScores.forEach((score: any) => {
        if (!scoresByCriteria[score.criteria_id]) {
          scoresByCriteria[score.criteria_id] = [];
        }
        scoresByCriteria[score.criteria_id].push(score.score);
      });
      
      // Calculate average scores per criteria
      const criteriaScores: Record<string, any> = {};
      let totalWeightedScore = 0;
      let totalWeight = 0;
      
      criteria.forEach((criterion: any) => {
        const criteriaId = criterion.id;
        const scores = scoresByCriteria[criteriaId] || [];
        const averageScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
          : 0;
        const weightedScore = averageScore * criterion.weight;
        
        criteriaScores[criteriaId] = {
          name: criterion.name,
          weight: criterion.weight,
          averageScore,
          weightedScore
        };
        
        totalWeightedScore += weightedScore;
        totalWeight += criterion.weight;
      });
      
      // Calculate average overall score
      const averageScore = Object.values(criteriaScores).reduce(
        (sum: number, criteriaScore: any) => sum + criteriaScore.averageScore, 0
      ) / Object.keys(criteriaScores).length || 0;
      
      // Calculate weighted overall score
      const weightedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      
      return {
        projectId,
        projectTitle: project.title,
        teamId: project.team_id,
        teamName: project.teams.name,
        averageScore,
        weightedScore,
        criteriaScores,
        judgeCount
      };
    });
    
    // Sort projects by weighted score (highest first)
    return projectScores.sort((a, b) => b.weightedScore - a.weightedScore);
    
  } catch (error) {
    console.error('Error calculating project scores:', error);
    throw error;
  }
}

/**
 * Check if a user is a judge for a given hackathon
 * @param supabase Supabase client instance
 * @param userId User ID to check
 * @param hackathonId Hackathon ID to check
 * @returns Promise that resolves with a boolean indicating if the user is a judge
 */
export async function isUserJudgeForHackathon(supabase: any, userId: string, hackathonId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('judges')
      .select('id')
      .eq('user_id', userId)
      .eq('hackathon_id', hackathonId)
      .limit(1);
    
    if (error) {
      console.error('Error checking judge status:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking judge status:', error);
    return false;
  }
}

/**
 * Check if a project has been fully scored by a judge
 * @param supabase Supabase client instance
 * @param projectId Project ID to check
 * @param judgeId Judge ID to check
 * @param hackathonId Hackathon ID to get criteria count
 * @returns Promise that resolves with a boolean indicating if the project is fully scored
 */
export async function isProjectFullyScored(
  supabase: any, 
  projectId: string, 
  judgeId: string, 
  hackathonId: string
): Promise<boolean> {
  try {
    // Get the number of criteria for this hackathon
    const { count: criteriaCount, error: criteriaError } = await supabase
      .from('judging_criteria')
      .select('id', { count: 'exact' })
      .eq('hackathon_id', hackathonId);
    
    if (criteriaError) {
      console.error('Error fetching criteria count:', criteriaError);
      return false;
    }
    
    // Get the number of scores this judge has submitted for this project
    const { count: scoreCount, error: scoreError } = await supabase
      .from('project_scores')
      .select('id', { count: 'exact' })
      .eq('project_id', projectId)
      .eq('judge_id', judgeId);
    
    if (scoreError) {
      console.error('Error fetching score count:', scoreError);
      return false;
    }
    
    return scoreCount === criteriaCount;
  } catch (error) {
    console.error('Error checking if project is fully scored:', error);
    return false;
  }
}