CORE REQUIRMENTS:
Project: AI SWE Mock Interviewer
V1:
Problem:
- right now when I am practicing mock interviews then I face issues like I have sometimes no one available to do mock interview with

- so I went to ChatGPT and started voice conversation

- but the issue with that voice conversation is: it's not good, because it goes linearly:
like for example:
ChatGPT: What tech stack you chose for FlashCard Engine?
Me: I chose Next Js, Ollama, MongoDB, Docker
ChatGPT: Well that looks like a solid choice!
Me: Hey you are acting as a mock interviewer, so please ask cross questions as much as you can!
ChatGPT: Well fine! I'll ask more cross questions. So here is your question: 'Why did you specifically chose this tech stack only?'
Me: there were few reasons to choose this tech stack as: JS I already knew hence it was beneficial for me as without learning a new tech stack I could just directly think about implementation and Ollama qwen0.5B LLM I chose because 1. I cannot expose my own API key of Claude to other and I want others also to use my Mock interviewer hence I preferred small local LLM like qwen 0.5B coz it was just like cross questioning and Docker to containerize the application.
ChatGPT: well that looks solic choice.
Me: Please always ask cross questions!
...And the chat continues like this only...

- if you observe the chat with chatGpt then how it is behaving:
it does linear processing i.e one after another questions and hence it may forget to ask some question that was necessary like here in the above example:
ChatGPT: What tech stack you chose for FlashCard Engine?
Me: I chose Next Js, Ollama, MongoDB, Docker
ChatGPT: Well that looks like a solid choice!

see here GPt asked the right question, no issues!
But when I answered it just said it's a solid choice. 
ideally it should have been like:
ChatGPT: What tech stack you chose for FlashCard Engine?
Me: I chose Next Js, Ollama, MongoDB, Docker

Thought process of ChatGPT after this:
this guy mentioned he has worked with Next JS, Ollama, MongoDB, Docker
so there are these possible scenarios the interview could go into:
                (tech Stack)
            /       |                                           \                               \
        Next Js     Ollama                                  MongoDB                             Docker
      /               |                                           |                                  |
    what and why?   what, why, how, which model and why?   why Nosql, why not SQL?              what, why?
        |               |                                   |                                       |  [I gave some response based on those these cross question]
    next Js uses    why only SLM?                           what are projections in         what is containerization?
    JS or TS        using LangChain or not?                 mongoDB? Does mongoDB offers    what are microservices?
                                                            ACID?
when I mentioned [I gave some response based on those these cross question]: it means like:
considering a scenario:
MongoDB:
AI: Why NoSQL, why not SQL?
Me: In my flashcard engine I required the flashcard to be flexible and I didn't knew what type of data can be there hence MongoDB offers me that flexibility, not SQL DBs hence I preferred MongoDB.
AI thought process: looks good reasonging, let me ask him some questions about mongodb to judge whether he knows about tradeoffs of SQL vs NoSQL or he has just memorized it from somewhere and throwing the answer.
AI: Okay fine! can you please tell me whether MongoDB offers ACID or not? and first tell me what are ACID properties?
...And the conversation continues, as I will give some response AI will generate some possible counter questions and will judge me through those...

- so if you clearly notice if we directly use ChatGPT or some other AI voice assist to do AI mock interview then it will be just linear pass and the AI will not be generating some good questions, coz it does linear pass, whereas the real interview is not linear instead it's tree based where there could be multiple child nodes of a parent node where each child node will represent a possible scenario or a question the interview may go forward into and things works in DFS way, not BFS.


V2: (include all the requirements of V1)
- the interviewer should choose which branch to pursue based on depth, gaps, confidence, and tradeoff reasoning
--- the next question/follow up can be based on the past answers interviewee has given (if the interviewer feels that interviewee is countering his previous statements what they mentioned earlier i.e earlier they said something else and now they are saying something else then interviewer can priortize this question)
- there will be multiple modes available for interviewee to practice in:
--- roast mode (full grind)
--- easy mode (keep it simple)
--- medium difficulty (like normal SWE interviews)
- we will be only focussing on SWE interviews, not other domains
- the difficulty of interview can change based on the experience, previous roles, work, projects, achievements of interviewee (but can be configurable)

- continue drilling into one branch until it is sufficiently explored
--- it's not like interviewer will be drilling into just one branch, if they want they can drill into multiple branches as well until that branch is sufficiently explored
--- also within the branch there could be multiple sub-branches that can be generated

- there will be a log that will be maintined by AI which will consist of the information of how much the interviewee knows about a topic for each topic there will be a score out of 10 maintined and there will be a reason maintained what went wrong and what went right and the reason will be very descriptive i.e even quoting the user about what was the question and what they answered

- then there will be an overall score that will be given to the user out of 10 and then the verdict will be given as:
--- if overallscore <= 4: Needs improvements
--- if overallscore <= 6: can be considered for next round
--- if overallscore <= 8: hire
--- if overallscore <= 10: strongly hire

- there will be a LLM sitting and we will be doing context mgmt on our own and will not be asking LLM to do the context mgmt, instead we will give LLM the whole context everything i.e who are you, what you should do, why you should do, how to do, what were the prev conversation, what are the explored nodes, what is the current state etc. and then LLM will be proceeding forward at each iteration.
- at each iteration, in context, LLM will also append the information about: what to do, and why to do?

- Using your example, if the candidate says Next.js, Ollama, MongoDB,
  Docker, the interviewer should not just say “solid choice.” It
  should identify four probe areas and decide where to go deeper:

  - framework choice
  - LLM/model choice
  - database tradeoffs
  - deployment/containerization
--- the choice where to go deeper can also depend on the JD the candidate is interviewing for.

- our AI mock interviewer will be expecting these following things from interviewee before starting:
--- Resume
--- JD (including job profile)
--- configurations for interview:
----- type of company: ['servicebased', 'productbased', 'startup']
----- difficulty: ['roast', 'easy', 'medium']
etc.
  1. Interview scope

  - only project/resume-based interviews? No
  - or also DSA, backend, frontend, system design? yes
  2. Interaction mode

  - text only first? no
  - voice first? yes
  - both? no
  
  3. Interviewer behavior

  - strict interviewer only? ask it in configs
  - interviewer + feedback coach? ask it in configs
  - should hints be allowed during the interview? ask it in configs (but hints should be given very small)
  
  4. Evaluation output

  - only conversation? no
  - or also final score, strengths, weak areas, ideal answers,
    improvement plan? yes

  5. Branching policy

  - should the AI explore one topic deeply before switching? 
    depends on user's answers, if the user's answers are actually very good, then fine no need to go more deeper, else go deeper
  - or keep a queue of unanswered branches and return later?
    we have to process unanswered branches but smartly coz if not processed smartly then there will be lots and lots of branches and the interview may never end

  6. Knowledge grounding

  - should it interview based on the user’s uploaded resume/project docs?
  based on resume, project, work ex, achievements. Expect a JD from user (mandatory, keep a sample JD also which the user can select based on generic SWE w.r.t experience)
  - or rely only on live conversation? no
  7. Session goal

  - realistic interview simulation: yes
  - interview prep and learning: yes
  - recruiter screening: yes
  My read of the strongest version
  Based on your requirements, the sharpest MVP is:

  - candidate uploads resume/project details
  - AI starts a mock technical interview on that project
  - every answer is parsed into claims, tools, decisions, and
    tradeoffs
  - AI builds a follow-up question tree
  - AI chooses the highest-value branch and drills deeper
  - AI keeps state of explored vs unexplored branches
  - session ends with structured feedback on depth, clarity, tradeoff
    understanding, and weak spots

  That would be a real product, not a wrapper over ChatGPT.
  yes this is actually good


V3 (include all till V2):
  1. Session length
     Do you want interviews to end by:
     - configurable by user, max 1 hour
  - fixed time like 20/30/45 mins
  - fixed question budget
  - or “enough coverage reached” based on branch exploration?
  2. Primary V1 interview types
     You listed project/resume, DSA, backend, frontend, system design.
     That is broad.
     For V1, should we support:

  - only resume/project + backend/frontend/system design discussion: yes
    or
  - include DSA coding round too? no
  3. Scoring semantics
     You defined 0-10 per topic and overall verdict, but not the
     dimensions.
     Should each topic be scored on fixed axes like:

  - correctness
  - depth
  - tradeoff reasoning
  - communication
  - consistency
  yes this is a better scoring version
  4. Recruiter screening
     You marked recruiter screening as yes, but that can mean two
     different products:

  - candidate self-practice with strong reports
  - actual recruiter-facing evaluation workflow

  For V1, which one is primary? I’d keep candidate-first and let
  recruiter use it secondarily.
  avoid as of now
  5. Voice interaction style
     Since this is voice-first:

  - should the AI interrupt naturally? no
  - or wait fully for the candidate to finish speaking before
    processing? yes