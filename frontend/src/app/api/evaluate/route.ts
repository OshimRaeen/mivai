// frontend/src/app/api/evaluate/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, transcript, code, language, category, difficulty, jobRole, problemStatement, compilerOutput } = body;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const formattedTranscript = transcript
      .map((t: any) => `${t.role === 'user' ? 'Candidate' : 'Interviewer'}: ${t.text}`)
      .join('\n');

    const isDSA = category.toLowerCase().includes('data structures') || 
                  category.toLowerCase().includes('dsa') ||
                  category.toLowerCase().includes('algorithm');

    const codeFeedbackSchema = isDSA 
      ? `"timeComplexity": "<string (e.g., O(n))>",
         "spaceComplexity": "<string (e.g., O(1))>",
         "quality": "<detailed string evaluating readability, edge cases, and syntax>"`
      : `"quality": "<detailed string evaluating architecture, component design, readability, and best practices>"`;

    const systemPrompt = `
      You are a strict, senior engineering manager at a top-tier tech company. 
      You are evaluating a candidate's technical interview.
      
      Job Role: ${jobRole}
      Category: ${category}
      Difficulty: ${difficulty}
      Language Used: ${language}

      THE PROBLEM STATEMENT THE CANDIDATE WAS ASKED TO SOLVE:
      """
      ${problemStatement || "No specific problem statement provided. Evaluate based on standard technical discussion."}
      """
      
      CANDIDATE CODE:
      \`\`\`${language}
      ${code}
      \`\`\`

      COMPILER / TERMINAL OUTPUT:
      """
      ${compilerOutput || "Candidate did not execute the code or no output was generated."}
      """
      
      INTERVIEW TRANSCRIPT:
      ${formattedTranscript}
      
      Evaluate the candidate's performance. You must return a strict JSON object with the following exact structure:
      {
        "overallScore": <number 0-100>,
        "strengths": ["<string>", "<string>"],
        "weaknesses": ["<string>", "<string>"],
        "codeFeedback": {
          ${codeFeedbackSchema}
        },
        "communicationFeedback": "<detailed string evaluating how well they explained their thought process>",
        "finalVerdict": "<Hire, Leaning Hire, Leaning No Hire, or No Hire>"
      }
    `;

    console.log('🧠 Sending interview data to Gemini for evaluation...');
    
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const evaluationData = JSON.parse(responseText);

    console.log('✅ AI Evaluation Complete! Handing off to Express Backend...');
    
    // 🚀 FIXED: Added problemStatement to the Express handoff payload
    const backendResponse = await fetch('http://localhost:5001/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        category,
        difficulty,
        jobRole,
        language,
        problemStatement, // <-- THE MISSING PIECE
        codeSnippet: code,
        evaluation: evaluationData
      })
    });

    if (!backendResponse.ok) {
      throw new Error('Express backend failed to save the interview.');
    }

    const savedData = await backendResponse.json();
    console.log(`💾 Interview saved successfully via Express backend! ID: ${savedData._id}`);

    return NextResponse.json({ 
      success: true, 
      interviewId: savedData._id, 
      evaluation: evaluationData 
    }, { status: 200 });

  } catch (error) {
    console.error('Evaluation Error:', error);
    return NextResponse.json({ error: 'Failed to evaluate interview' }, { status: 500 });
  }
}





// import { NextResponse } from 'next/server';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// // Initialize the Gemini client
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { transcript, code, language, category, difficulty, jobRole } = body;

//     // We use gemini-1.5-pro for complex logic and reasoning tasks
//     const model = genAI.getGenerativeModel({ 
//       model: 'gemini-2.5-flash',
//       generationConfig: {
//         // This forces Gemini to strictly return parsable JSON
//         responseMimeType: 'application/json',
//       }
//     });

//     // We format the transcript array into a readable script
//     const formattedTranscript = transcript
//       .map((t: any) => `${t.role === 'user' ? 'Candidate' : 'Interviewer'}: ${t.text}`)
//       .join('\n');

//     const systemPrompt = `
//       You are a strict, senior engineering manager at a top-tier tech company. 
//       You are evaluating a candidate's technical interview.
      
//       Job Role: ${jobRole}
//       Category: ${category}
//       Difficulty: ${difficulty}
//       Language Used: ${language}
      
//       CANDIDATE CODE:
//       \`\`\`${language}
//       ${code}
//       \`\`\`
      
//       INTERVIEW TRANSCRIPT:
//       ${formattedTranscript}
      
//       Evaluate the candidate's performance. You must return a strict JSON object with the following exact structure:
//       {
//         "overallScore": <number 0-100>,
//         "strengths": ["<string>", "<string>"],
//         "weaknesses": ["<string>", "<string>"],
//         "codeFeedback": {
//           "timeComplexity": "<string (e.g., O(n))>",
//           "spaceComplexity": "<string>",
//           "quality": "<detailed string evaluating readability, edge cases, and syntax>"
//         },
//         "communicationFeedback": "<detailed string evaluating how well they explained their thought process>",
//         "finalVerdict": "<Hire, Leaning Hire, Leaning No Hire, or No Hire>"
//       }
//     `;

//     console.log('🧠 Sending interview data to Gemini for evaluation...');
    
//     const result = await model.generateContent(systemPrompt);
//     const responseText = result.response.text();
    
//     // Parse the JSON string returned by Gemini into an actual object
//     const evaluationData = JSON.parse(responseText);

//     console.log('✅ Evaluation Complete!');
//     console.log(evaluationData);

//     return NextResponse.json({ success: true, evaluation: evaluationData }, { status: 200 });

//   } catch (error) {
//     console.error('Evaluation Error:', error);
//     return NextResponse.json({ error: 'Failed to evaluate interview' }, { status: 500 });
//   }
// }