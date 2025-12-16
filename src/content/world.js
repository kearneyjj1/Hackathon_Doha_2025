export const world = {
  road: {
    title: "Trove of Integrity",
    media: { src: "/videos/select_character.mp4", caption: "Welcome to the UN integrity quiz." },
    onEnter({ print }) {
      print("You stand at the entrance.", "narration");
      print("You heard stories of an educator in the area.", "narration");
      print("To continue, you must learn the basics of the interface and pick a guide", "system");
      print("Hint, type help or direction in any room to see the available commands and potential routes", "danger");
      print("What do you do?", "prompt");
    },
    exits: {
        north: {
        to: "gracie",
        blocked: ({ state }) => !state.flags.solvedRoadPuzzle,
        message: "A force pins you in place. Choose a guide here first.",
      }
    },
    actions: {
      inspect({ print }) {
        print("Great! Each room can have unique commands so always check! If you're ready to move on, pick a guide\"", "loot");
      },
      rest({ print, state }) {
        state.player.hp = Math.min(state.player.hp + 2, 12);
        print("You rest briefly. Your breathing steadies.", "success");
      },
      owl({ print, state }) {
        state.flags.solvedRoadPuzzle = true;
        state.character = "owl";
        print("You have chosen the owl", "loot");
        print("The pressure lifts. The road opens. Good job!", "success");
      },
      badger({ print, state }) {
        state.flags.solvedRoadPuzzle = true;
        state.character = "badger";
        print("You have chosen the badger", "loot");
        print("The pressure lifts. The road opens. Good job!", "success");
      },
      oryx({ print, state }) {
        state.flags.solvedRoadPuzzle = true;
        state.character = "oryx";
        print("You have chosen the oryx", "loot");
        print("The pressure lifts. The road opens. Good job!", "success");
      }
    },
  },

  gracie: {
    title: "Gracie's Abode",
    media: ({ state }) => ({ src: `/videos/${state.character}/intro.mp4`, caption: "Gracie is here to help." }),

    onEnter({ print }) {
      print("Welcome, and say hello to your guide.", "narration");
    },
    exits: { 
        south: {
            to: "road"
        },
        north: {
            to: "quizRoom1"
        },
    },
    actions: {
      listen: ({ print, setVideo, state }) => {
        print("Gracie explains...", "narration");
        setVideo({ src: `/videos/${state.character}/intro_detailed.mp4`, caption: "You listen…" });
      },
    },
  },
  // Full quiz rooms + interstitial rooms + dead ends + hints
    // Drop into your world object. Assumes existing road + gracie.
    // Notes:
    // - Each quizRoom prints its quiz on enter if not solved (same pattern you used).
    // - Each quizRoom north exit goes to an interstitial “game element” room.
    // - Each interstitial room north exit goes to the next quiz room (with its own gating).
    // - Final quizRoom10 north goes to nextRoom (unchanged).

    // --------------------
    // QUIZ ROOM 1
    // --------------------
    quizRoom1: {
    title: "Quiz Room I",
    media: ({ state }) => ({ src: `/videos/${state.character}/first_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "anteroom1",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom1.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "gracie" },
    },

    quiz: {
        id: "uncac_definition",
        question:
        "Does the United Nations Convention against Corruption (UNCAC) provide a single overarching definition of corruption?",
        answers: {
        a: { text: "Yes it defines corruption as the abuse of public power for private gain" },
        b: { text: "No it defines and classifies various specific acts of corruption as criminal offences" },
        c: { text: "Yes it defines corruption as bribery only" },
        d: { text: "No it leaves the definition entirely up to the private sector" },
        },
        correct: "b",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: Read the question carefully. The correct option describes UNCAC listing specific offences.", "system");
        },
        inspect({ print }) {
        print("The room is quiet. The only way forward is to answer correctly.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 1 -> 2
    // --------------------
    anteroom1: {
    title: "Lantern Anteroom",
    media: { src: `/videos/lantern.mp4`, caption: "A small room lit by paper lanterns." },

    onEnter({ print, state }) {
        print("A narrow anteroom hums quietly. A brass switch sits beside a sealed door.", "narration");
        if (!state.flags.anteroom1_powered) {
        print("The seal looks inactive, but the door won’t budge.", "system");
        } else {
        print("The seal glows faintly. The way forward is open.", "success");
        }
    },

    exits: {
        south: { to: "quizRoom1" },
        north: {
        to: "quizRoom2",
        blocked: ({ state }) => !state.flags.anteroom1_powered,
        message: "The seal is dormant. You need to power it.",
        },
        east: { to: "deadEndCloset" },
    },

    actions: {
        inspect({ print }) {
        print("A brass switch with an engraved notch. It looks like it can be pulled down.", "loot");
        },
        pull({ print, state }) {
        state.flags.anteroom1_powered = true;
        print("You pull the switch. The seal stirs and the door unlocks with a soft click.", "success");
        },
        hint({ print }) {
        print("Hint: The exit north is blocked until you use the switch. Try 'pull'.", "system");
        },
        rest({ print, state }) {
        state.player.hp = Math.min(state.player.hp + 1, 12);
        print("You steady yourself under the lantern light.", "success");
        },
    },
    },

    deadEndCloset: {
    title: "Broom Closet",
    media: { src: `/videos/broom_cupboard.mp4`, caption: "Nothing glamorous in here." },
    onEnter({ print }) {
        print("A cramped closet. Old brooms. Empty boxes. No hidden switches.", "narration");
        print("Dead end. Head back west.", "system");
    },
    exits: { west: { to: "anteroom1" } },
    actions: {
        inspect({ print }) {
        print("You find dust and regret. Nothing useful.", "danger");
        },
        hint({ print }) {
        print("Hint: This is a dead end. Go west.", "system");
        },
    },
    },

    // --------------------
    // QUIZ ROOM 2
    // --------------------
    quizRoom2: {
    title: "Quiz Room II",
    media: ({ state }) => ({ src: `/videos/${state.character}/next_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "archiveWalkway",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom2.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "quizRoom1" },
    },

    quiz: {
        id: "good_governance_principle",
        question:
        "Which of the following is NOT listed as a core principle of good governance in the UNODC modules?",
        answers: {
        a: { text: "Transparency" },
        b: { text: "Rule of Law" },
        c: { text: "Secrecy" },
        d: { text: "Accountability" },
        },
        correct: "c",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: Three options are standard governance ideals; one is the opposite.", "system");
        },
        inspect({ print }) {
        print("The walls list principles. One is clearly out of place.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 2 -> 3 (key gate)
    // --------------------
    archiveWalkway: {
    title: "Archive Walkway",
    media: { src: `/videos/archive.mp4`, caption: "Stacks of ledgers and narrow aisles." },

    onEnter({ print, state }) {
        print("You step onto a walkway above a deep archive. A drawer is half-open nearby.", "narration");
        if (!state.flags.archive_key_found) {
        print("A plaque reads: 'Some doors open only when you take what is offered.'", "system");
        } else {
        print("A small iron key rests in your possession. The north door looks ready.", "success");
        }
    },

    exits: {
        south: { to: "quizRoom2" },
        north: {
        to: "quizRoom3",
        blocked: ({ state }) => !state.flags.archive_key_found,
        message: "A lock catches the door. Something is missing.",
        },
        east: { to: "deadEndStacks" },
    },

    actions: {
        inspect({ print, state }) {
        print("Dusty ledgers, stamped forms, and a drawer with scuffed edges from frequent use.", "narration");
        if (state.flags.archive_key_found) {
            print("You already searched the drawer. It’s empty now.", "system");
            return;
        }
        state.flags.archive_key_found = true;
        print("You pull open the drawer and find a small iron key.", "loot");
        print("The north door’s lock looks like it matches.", "system");
        },
        hint({ print }) {
        print("Hint: You need something from this room to open the north door. Try 'inspect'.", "system");
        },
    },
    },

    deadEndStacks: {
    title: "Collapsed Stacks",
    media: { src: `/videos/deadend_stacks.mp4`, caption: "A blocked aisle." },
    onEnter({ print }) {
        print("Aisles collapse into rubble. You can’t pass. It’s a dead end.", "narration");
        print("Head back west.", "system");
    },
    exits: { west: { to: "archiveWalkway" } },
    actions: {
        climb({ print, state }) {
        state.player.hp = Math.max(state.player.hp - 1, 0);
        print("You try to climb the rubble, slip, and lose some breath. Nothing gained.", "danger");
        },
        hint({ print }) {
        print("Hint: This path is blocked. Go back west.", "system");
        },
    },
    },

    // --------------------
    // QUIZ ROOM 3
    // --------------------
    quizRoom3: {
    title: "Quiz Room III",
    media: ({ state }) => ({ src: `/videos/${state.character}/next_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "twinOfficeFoyer",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom3.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "quizRoom2" },
    },

    quiz: {
        id: "public_vs_private",
        question: "What is the primary distinction between public sector corruption and private sector corruption?",
        answers: {
        a: { text: "Public sector corruption involves large sums of money while private does not" },
        b: {
            text: "Public sector corruption abuses government resources while private sector corruption abuses private or commercial resources",
        },
        c: { text: "Private sector corruption is not a crime while public sector corruption is" },
        d: { text: "There is no distinction" },
        },
        correct: "b",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: The distinction is about what kind of resources/power is abused.", "system");
        },
        inspect({ print }) {
        print("Two doors are painted on the walls: GOVERNMENT and BUSINESS.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 3 -> 4 (lever puzzle + dead end)
    // --------------------
    twinOfficeFoyer: {
    title: "Twin Office Foyer",
    media: { src: `/videos/twin_office.mp4`, caption: "Two doors. One mechanism." },

    onEnter({ print, state }) {
        print("A foyer sits between two heavy doors marked up: PUBLIC and down: PRIVATE.", "narration");
        if (!state.flags.foyer_balance_set) {
        print("A central lever is stuck in the middle. The north passage remains sealed.", "system");
        print("Hint: Try 'up' or 'down'.", "danger");
        } else {
        print("The lever is set. A passage opens north.", "success");
        }
    },

    exits: {
        south: { to: "quizRoom3" },
        north: {
        to: "quizRoom4",
        blocked: ({ state }) => !state.flags.foyer_balance_set,
        message: "The passage won’t open until the lever is set.",
        },
        west: { to: "deadEndMeetingRoom" },
    },

    actions: {
        inspect({ print }) {
        print("A lever labelled: 'Allocate oversight focus'. It can be set toward PUBLIC or PRIVATE.", "loot");
        },
        up({ print, state }) {
            state.flags.foyer_balance_set = true;
            print(`You set the lever toward PUBLIC. The mechanism unlocks the north passage.`, "success");
        },
        down({ print, state }) {
            state.flags.foyer_balance_set = false;
            print("The lever makes an unsatisfying click as you set it to PRIVATE");
        },
        hint({ print }) {
        print("Hint: The lever must be set to either side to open the north passage.", "system");
        },
    },
    },

    deadEndMeetingRoom: {
    title: "Glass Meeting Room",
    media: { src: `/videos/glass_meeting_room.mp4`, caption: "An empty meeting room." },
    onEnter({ print }) {
        print("A meeting room with a whiteboard full of erased scribbles. No exits forward.", "narration");
        print("Dead end. Go back east.", "system");
    },
    exits: { east: { to: "twinOfficeFoyer" } },
    actions: {
        read({ print }) {
        print("Only ghost marks remain. Whatever was decided here is long gone.", "system");
        },
        hint({ print }) {
        print("Hint: This is a dead end. Return east.", "system");
        },
    },
    },

    // --------------------
    // QUIZ ROOM 4
    // --------------------
    quizRoom4: {
    title: "Quiz Room IV",
    media: ({ state }) => ({ src: `/videos/${state.character}/next_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "sealedCabinet",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom4.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "quizRoom3" },
    },

    quiz: {
        id: "whistle_blowing",
        question:
        "What is the term used to describe the disclosure by organization members of illegal immoral or illegitimate practices under the control of their employers?",
        answers: {
        a: { text: "Whistle-blowing" },
        b: { text: "Blacklisting" },
        c: { text: "Money-laundering" },
        d: { text: "Trading in influence" },
        },
        correct: "a",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: The term describes an internal disclosure of wrongdoing.", "system");
        },
        inspect({ print }) {
        print("A frosted glass panel shows a silhouette holding papers.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 4 -> 5 (unseal to proceed)
    // --------------------
    sealedCabinet: {
    title: "Sealed Cabinet",
    media: { src: `/videos/sealed_cabinet.mp4`, caption: "A cabinet with a tamper seal." },

    onEnter({ print, state }) {
        print("A cabinet blocks the route. It has a tamper seal and a simple latch.", "narration");
        if (!state.flags.cabinet_unsealed) {
        } else {
        print("The cabinet has been opened and moved aside.", "success");
        }
    },

    exits: {
        south: { to: "quizRoom4" },
        north: {
        to: "quizRoom5",
        blocked: ({ state }) => !state.flags.cabinet_unsealed,
        message: "The cabinet still blocks the way.",
        },
    },

    actions: {
        unseal({ print, state }) {
        if (state.flags.cabinet_unsealed) {
            print("It’s already unsealed.", "system");
            return;
        }
        state.flags.cabinet_unsealed = true;
        print("You break the seal and swing the cabinet aside. The north passage clears.", "success");
        },
        inspect({ print }) {
        print("A plain tamper seal. No tricks. Just a latch that won’t open until the seal is broken.", "system");
        },
        hint({ print }) {
        print("Hint: The north exit stays blocked until you 'unseal' the cabinet.", "system");
        },
    },
    },

    // --------------------
    // QUIZ ROOM 5
    // --------------------
    quizRoom5: {
    title: "Quiz Room V",
    media: ({ state }) => ({ src: `/videos/${state.character}/next_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "quietAtrium",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom5.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "quizRoom4" },
    },

    quiz: {
        id: "sextortion",
        question: "According to the modules what is 'sextortion'?",
        answers: {
        a: { text: "A form of corruption where sex is the currency of the bribe" },
        b: { text: "A cybercrime involving phishing emails" },
        c: { text: "A type of embezzlement" },
        d: { text: "A method of money laundering" },
        },
        correct: "a",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: It’s corruption, but the 'currency' is not money.", "system");
        },
        inspect({ print }) {
        print("The room feels tense. Nothing here suggests money or ledgers.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 5 -> 6 (optional trap + hint)
    // --------------------
    quietAtrium: {
    title: "Quiet Atrium",
    media: { src: `/videos/warning.mp4`, caption: "A calm space with a warning sign." },

    onEnter({ print }) {
        print("A quiet atrium. A sign reads: 'Some choices cost you. Watch your footing.'", "narration");
        print("Hint: If you get hurt in side rooms, 'rest' can help.", "system");
    },

    exits: {
        south: { to: "quizRoom5" },
        north: { to: "quizRoom6" },
        east: { to: "tripwireHall" },
    },

    actions: {
        inspect({ print }) {
        print("The floor tiles are numbered. Some are loose near the east hall.", "loot");
        },
        hint({ print }) {
        print("Hint: East is optional (and risky). North progresses.", "system");
        },
        rest({ print, state }) {
        state.player.hp = Math.min(state.player.hp + 1, 12);
        print("You take a moment to breathe. You feel slightly better.", "success");
        },
    },
    },

    tripwireHall: {
    title: "Tripwire Hall",
    media: { src: `/videos/tripwire.mp4`, caption: "A narrow hall with an obvious trap." },
    onEnter({ print }) {
        print("A wire glints across the floor. Past it, nothing but darkness.", "narration");
    },
    exits: { west: { to: "quietAtrium" } },
    actions: {
        step({ print, state }) {
        state.player.hp = Math.max(state.player.hp - 2, 0);
        print("You step forward. The wire snaps. A dart grazes you. Dead end anyway.", "danger");
        },
        hint({ print }) {
        print("Hint: There is no reward here. Go west.", "system");
        },
    },
    },

    // --------------------
    // QUIZ ROOM 6
    // --------------------
    quizRoom6: {
    title: "Quiz Room VI",
    media: ({ state }) => ({ src: `/videos/${state.character}/next_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "forumThreshold",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom6.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "quizRoom5" },
    },

    quiz: {
        id: "meaningful_youth_engagement",
        question: "Which of the following is considered a theme of 'Meaningful Youth Engagement'?",
        answers: {
        a: { text: "Youth tokenism" },
        b: { text: "Adult-led decision making" },
        c: { text: "Intergenerational collaboration" },
        d: { text: "Excluding marginalized groups" },
        },
        correct: "c",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: Meaningful engagement involves working across generations, not symbolic inclusion.", "system");
        },
        inspect({ print }) {
        print("Rows of empty chairs face a round table.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 6 -> 7 (pledge gate + dead end)
    // --------------------
    forumThreshold: {
    title: "Forum Threshold",
    media: { src: `/videos/pledge.mp4`, caption: "A threshold with a simple oath." },

    onEnter({ print, state }) {
        print("A threshold stone asks for a pledge before allowing passage.", "narration");
        if (!state.flags.pledge_made) {
        } else {
        print("The stone is satisfied. You can move on.", "success");
        }
    },

    exits: {
        south: { to: "quizRoom6" },
        north: {
        to: "quizRoom7",
        blocked: ({ state }) => !state.flags.pledge_made,
        message: "The threshold refuses you. Make a pledge first.",
        },
        east: { to: "deadEndGallery" },
    },

    actions: {
        pledge({ print, state }) {
        state.flags.pledge_made = true;
        print("You place your hand on the stone. It warms slightly. The way opens.", "success");
        },
        inspect({ print }) {
        print("Just one word is carved repeatedly: 'ENGAGE'.", "system");
        },
        hint({ print }) {
        print("Hint: The north exit is blocked until you 'pledge'.", "system");
        },
    },
    },

    deadEndGallery: {
    title: "Empty Gallery",
    media: { src: `/videos/blank_gallery.mp4`, caption: "Blank frames." },
    onEnter({ print }) {
        print("Blank frames line the walls. It’s an intentional dead end.", "narration");
        print("Return west.", "system");
    },
    exits: { west: { to: "forumThreshold" } },
    actions: {
        inspect({ print }) {
        print("Nothing is hidden here. It’s just silence.", "system");
        },
        hint({ print }) {
        print("Hint: Nothing here. Go west.", "system");
        },
    },
    },

    // --------------------
    // QUIZ ROOM 7
    // --------------------
    quizRoom7: {
    title: "Quiz Room VII",
    media: ({ state }) => ({ src: `/videos/${state.character}/next_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "oversightDesk",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom7.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "quizRoom6" },
    },

    quiz: {
        id: "detecting_corruption",
        question: "Which mechanism is cited as a primary method for detecting corruption?",
        answers: {
        a: { text: "Ignoring red flags" },
        b: { text: "Auditing (internal and external)" },
        c: { text: "Reducing transparency" },
        d: { text: "Limiting access to information" },
        },
        correct: "b",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: The correct mechanism involves formal checking processes.", "system");
        },
        inspect({ print }) {
        print("A desk lamp shines over piles of forms.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 7 -> 8 (stamp puzzle)
    // --------------------
    oversightDesk: {
    title: "Oversight Desk",
    media: { src: `/videos/oversight_office.mp4`, caption: "Forms. Stamps. Checks." },

    onEnter({ print, state }) {
        print("A desk blocks the corridor. A stamp tray sits beside a stack of forms.", "narration");
        if (!state.flags.forms_stamped) {
        print("The forms are still unstamped.", "system");
        } else {
        print("Stamped and verified. The north door is ready.", "success");
        }
    },

    exits: {
        south: { to: "quizRoom7" },
        north: {
        to: "quizRoom8",
        blocked: ({ state }) => !state.flags.forms_stamped,
        message: "The door requires verified paperwork.",
        },
    },

    actions: {
        inspect({ print, state }) {
        if (!state.flags.audit_stamp_taken) {
            state.flags.audit_stamp_taken = true;
            print("You find a heavy stamp marked 'AUDIT' and take it.", "loot");
        } else {
            print("Just paperwork and ink pads.", "system");
        }
        },
        take({ print, state }) {
        if (state.flags.audit_stamp_taken) {
            print("You already have the stamp.", "system");
            return;
        }
        state.flags.audit_stamp_taken = true;
        print("You take the audit stamp.", "loot");
        },
        stamp({ print, state }) {
        if (!state.flags.audit_stamp_taken) {
            print("You need the stamp first.", "danger");
            return;
        }
        state.flags.forms_stamped = true;
        print("You stamp the forms. The lock acknowledges the verification.", "success");
        },
        hint({ print, state }) {
        if (!state.flags.audit_stamp_taken) {
            print("Hint: You need to acquire something here. Try 'inspect' or 'take'.", "system");
        } else if (!state.flags.forms_stamped) {
            print("Hint: You have the stamp. Use 'stamp' to verify the forms.", "system");
        } else {
            print("Hint: You’re done here. Go north.", "system");
        }
        },
    },
    },

    // --------------------
    // QUIZ ROOM 8
    // --------------------
    quizRoom8: {
    title: "Quiz Room VIII",
    media: ({ state }) => ({ src: `/videos/${state.character}/next_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "hallMonitor",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom8.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "quizRoom7" },
    },

    quiz: {
        id: "education_sector_corruption",
        question: "Which of the following is an example of corruption in the education sector?",
        answers: {
        a: { text: "A library having few books due to lack of funds" },
        b: { text: "A professor requiring sexual favours in exchange for a passing grade" },
        c: { text: "A school closing due to a natural disaster" },
        d: { text: "Students forming a study group" },
        },
        correct: "b",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: Look for abuse of authority, not ordinary hardship or normal events.", "system");
        },
        inspect({ print }) {
        print("A lecture hall silhouette flickers across the walls.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 8 -> 9 (pass gate + side office + dead end feel)
    // --------------------
    hallMonitor: {
    title: "Hall Monitor Station",
    media: { src: `/videos/hall_monitor.mp4`, caption: "A gatekeeping desk." },

    onEnter({ print, state }) {
        print("A station blocks access to the next corridor. A sign: 'PASS REQUIRED'.", "narration");
        if (!state.flags.classroom_pass) {
        print("A side office door is ajar to the west.", "system");
        } else {
        print("You have a pass. The station no longer stops you.", "success");
        }
    },

    exits: {
        south: { to: "quizRoom8" },
        north: {
        to: "quizRoom9",
        blocked: ({ state }) => !state.flags.classroom_pass,
        message: "No pass. No entry.",
        },
        west: { to: "sideOffice" },
    },

    actions: {
        inspect({ print }) {
        print("A clipboard and a small slot for a paper pass. The lock seems strict.", "system");
        },
        hint({ print, state }) {
        if (!state.flags.classroom_pass) {
            print("Hint: You need a pass. Check the side office to the west.", "system");
        } else {
            print("Hint: You have the pass. Go north.", "system");
        }
        },
    },
    },

    sideOffice: {
    title: "Side Office",
    media: { src: `/videos/office.mp4`, caption: "A small office with a drawer." },

    onEnter({ print, state }) {
        print("A small office. A drawer is slightly open.", "narration");
        if (!state.flags.classroom_pass) {
        print("Maybe there is something that can help you on your journey.", "narration");
        } else {
        print("You already took the pass.", "success");
        }
    },

    exits: { east: { to: "hallMonitor" } },

    actions: {
        inspect({ print, state }) {
        if (state.flags.classroom_pass) {
            print("The drawer is empty now.", "system");
            return;
        }
        state.flags.classroom_pass = true;
        print("You find a paper pass labelled 'LECTURE HALL ACCESS' and pocket it.", "loot");
        },
        hint({ print }) {
        print("Hint: Inspect the drawer.", "system");
        },
    },
    },

    // --------------------
    // QUIZ ROOM 9
    // --------------------
    quizRoom9: {
    title: "Quiz Room IX",
    media: ({ state }) => ({ src: `/videos/${state.character}/next_question.mp4`, caption: "Answer to proceed." }),

    exits: {
        north: {
        to: "rightsGalleryFoyer",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom9.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "quizRoom8" },
    },

    quiz: {
        id: "human_rights_impact",
        question: "How does corruption impact human rights?",
        answers: {
        a: { text: "It has no impact on human rights" },
        b: { text: "It only affects civil and political rights" },
        c: { text: "It is a structural obstacle to the implementation and enjoyment of all human rights" },
        d: { text: "It improves the realization of economic rights" },
        },
        correct: "c",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: The correct option treats corruption as a broad, systemic obstacle affecting all rights.", "system");
        },
        inspect({ print }) {
        print("Panels labelled HEALTH, EDUCATION, JUSTICE, and DIGNITY flicker in unison.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },

    // --------------------
    // BETWEEN 9 -> 10 (dead end optional)
    // --------------------
    rightsGalleryFoyer: {
    title: "Rights Gallery Foyer",
    media: { src: `/videos/right_gallery_foyer.mp4`, caption: "Panels and corridors." },

    onEnter({ print }) {
        print("A foyer lined with panels: HEALTH, EDUCATION, JUSTICE, DIGNITY.", "narration");
        print("A corridor runs north. Another runs east into shadow.", "system");
    },

    exits: {
        south: { to: "quizRoom9" },
        north: { to: "quizRoom10" },
        east: { to: "deadEndShadowCorridor" },
    },

    actions: {
        inspect({ print }) {
        print("The panels are interconnected. Damage to one seems to affect the rest.", "system");
        },
        hint({ print }) {
        print("Hint: If you just want progress, go north.", "system");
        },
    },
    },

    deadEndShadowCorridor: {
    title: "Shadow Corridor",
    media: { src: `/videos/shadow_corridor.mp4`, caption: "A corridor that goes nowhere." },
    onEnter({ print }) {
        print("The corridor narrows until it becomes impassable darkness.", "narration");
        print("Dead end. Return west.", "system");
    },
    exits: { west: { to: "rightsGalleryFoyer" } },
    actions: {
        listen({ print }) {
        print("You hear nothing. Not even your own breath for a moment.", "danger");
        },
        hint({ print }) {
        print("Hint: This is a dead end. Go west.", "system");
        },
    },
    },

    // --------------------
    // QUIZ ROOM 10
    // --------------------
    quizRoom10: {
    title: "Quiz Room X",
    media: ({ state }) => ({ src: `/videos/${state.character}/final_question.mp4`, caption: "Answer to proceed." }),

    exits: {
      north: {
        to: "completionRoom",
        blocked: ({ state, world }) => !state.flags[`${world.quizRoom10.quiz.id}_solved`],
        message: "You must pass the test",
        },
        south: { to: "rightsGalleryFoyer" },
    },

    quiz: {
        id: "peace_security_link",
        question: "According to the modules how is corruption linked to peace and security?",
        answers: {
        a: { text: "Corruption is a driver of conflict and instability" },
        b: { text: "Corruption only occurs during times of peace" },
        c: { text: "Corruption strengthens national security" },
        d: { text: "Corruption has no correlation with violence" },
        },
        correct: "a",
        onCorrect: "The lock clicks open. The way forward is yours.",
        onWrong: "The ink blurs. That’s not right.",
        prompt: "Type: answer a, answer b, answer c, or answer d",
        answerMedia: {
        a: ({ state }) => ({ src: `/videos/${state.character}/correct.mp4`, caption: "Correct." }),
        b: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        c: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        d: ({ state }) => ({ src: `/videos/${state.character}/incorrect.mp4`, caption: "Not quite." }),
        },
    },

    actions: {
        hint({ print }) {
        print("Hint: The correct option treats corruption as a cause of instability and conflict.", "system");
        },
        inspect({ print }) {
        print("A map of fractured regions flickers, lines of tension spreading outward.", "narration");
        },
    },

    onEnter({ print, state, room }) {
        print("Welcome to the test room", "narration");
        if (room.quiz && !state.flags[`${room.quiz.id}_solved`]) {
        print(room.quiz.question, "narration");
        for (const [k, v] of Object.entries(room.quiz.answers)) {
            print(`${k}) ${v.text}`, "system");
        }
        print(room.quiz.prompt ?? "Type: answer <letter>", "prompt");
        print("Hint: type 'hint' if you get stuck.", "danger");
        } else {
        print("You have already passed this test.", "success");
        }
    },
    },
  completionRoom: {
  title: "Completion Hall",
  media: ({ state }) => ({ src: `/videos/${state.character}/completion.mp4`, caption: "You made it to the end." }),

  onEnter({ print, state }) {
    print("The final door closes behind you.", "narration");
    print("A quiet stillness settles over the hall.", "narration");

    // Optional: simple completion flag + lightweight summary
    state.flags.gameCompleted = true;

    // Count solved quizzes (safe even if some are missing)
    const quizIds = [
      "uncac_definition",
      "good_governance_principle",
      "public_vs_private",
      "whistle_blowing",
      "sextortion",
      "meaningful_youth_engagement",
      "detecting_corruption",
      "education_sector_corruption",
      "human_rights_impact",
      "peace_security_link",
    ];
    const solved = quizIds.reduce((acc, id) => acc + (state.flags[`${id}_solved`] ? 1 : 0), 0);

    print("Congratulations. You completed the integrity quiz.", "success");
    print(`Progress: ${solved}/${quizIds.length} tests passed.`, "system");
    print("You’ve proven you can move through pressure, uncertainty, and false paths without giving up.", "narration");
    print("Type celebrate, stats, or return.", "prompt");
  },

  exits: {
    // Optional: let them wander back or end here
    south: { to: "quizRoom10" },
    west: { to: "gracie" },
  },

  actions: {
    celebrate({ print }) {
      print("Well done. The hall echoes with approval.", "success");
      print("You’re finished. No more locks. No more gates.", "narration");
    },
    stats({ print, state }) {
      const quizIds = [
        "uncac_definition",
        "good_governance_principle",
        "public_vs_private",
        "whistle_blowing",
        "sextortion",
        "meaningful_youth_engagement",
        "detecting_corruption",
        "education_sector_corruption",
        "human_rights_impact",
        "peace_security_link",
      ];
      const solved = quizIds.reduce((acc, id) => acc + (state.flags[`${id}_solved`] ? 1 : 0), 0);
      print(`Tests passed: ${solved}/${quizIds.length}`, "system");
      print(`HP: ${state.player?.hp ?? "?"}`, "system");
    },
    return({ print }) {
      print("You turn back toward the earlier halls.", "narration");
    },
  },
},

};
