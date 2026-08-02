import { NextResponse } from "next/server";

const examplePrompt =
  "אני אוהב כדורסל. הנה חומר הלימוד: פוטוסינתזה היא התהליך שבו צמחים משתמשים באור כדי להמיר מים ופחמן דו-חמצני לגלוקוז וחמצן.";

export async function GET() {
  return NextResponse.json({
    description:
      "Adaptive AI Teacher is a conversational ReAct learning agent. A dynamic LearningSupervisor chooses the most useful tool on every turn—analysis, interest discovery, explanation, personalized storytelling, question generation, answer evaluation, direct response, or stopping. There is no fixed learning path. The supplied text is authoritative; general model knowledge may enrich explanations but never overrides conflicting source material. The session is temporary and capped at 16 total LLM calls.",
    purpose:
      "Turn plain-text learning material into a personalized, interactive lesson that adapts to the student's interests, answers, weak topics, and demonstrated mastery.",
    prompt_template: {
      template:
        "Interests (optional): <what you enjoy>\nLearning material: <paste plain text>\nRequest (optional): <explain, quiz me, teach through a story, or let the agent decide>",
      example: examplePrompt,
    },
    prompt_examples: [
      {
        prompt: examplePrompt,
        full_response:
          "קיבלתי את החומר. כדי לחבר את הפוטוסינתזה לכדורסל, דמיין שהעלה הוא המגרש: אור השמש מספק את האנרגיה, מים ופחמן דו-חמצני הם השחקנים שנכנסים למהלך, והגלוקוז הוא הנקודות שהצמח מייצר. החמצן משתחרר כתוצר נוסף. עכשיו שאלה קצרה: אילו שני חומרים נכנסים לתהליך?",
        steps: [
          {
            module: "LearningSupervisor",
            prompt: {
              System_prompt:
                "Select exactly one useful action from the available adaptive learning tools. There is no fixed workflow.",
              User_prompt: examplePrompt,
            },
            response: {
              action: "StoryTool",
              reason: "The student supplied material and an interest that can personalize the explanation.",
              tool_instruction: "Explain photosynthesis through a concise basketball analogy and end with one check question.",
              direct_response: "",
            },
          },
          {
            module: "StoryTool",
            prompt: {
              System_prompt:
                "Teach from the authoritative source through a story connected to the student's interests.",
              User_prompt: examplePrompt,
            },
            response: {
              response:
                "קיבלתי את החומר. כדי לחבר את הפוטוסינתזה לכדורסל, דמיין שהעלה הוא המגרש: אור השמש מספק את האנרגיה, מים ופחמן דו-חמצני הם השחקנים שנכנסים למהלך, והגלוקוז הוא הנקודות שהצמח מייצר. החמצן משתחרר כתוצר נוסף. עכשיו שאלה קצרה: אילו שני חומרים נכנסים לתהליך?",
              interests: ["כדורסל"],
              topics: ["פוטוסינתזה"],
              questions: ["אילו שני חומרים נכנסים לתהליך?"],
            },
          },
        ],
      },
    ],
  });
}
