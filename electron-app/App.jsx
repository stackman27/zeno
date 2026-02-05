import React, { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider,
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  ButtonGroup,
  VStack,
  HStack,
  Grid,
  GridItem,
  Code,
  useToast,
  Badge,
  IconButton,
  Flex,
  Spacer,
  Divider,
  extendTheme,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Center,
  Tooltip,
  Textarea
} from '@chakra-ui/react';
import { ChevronRightIcon, CloseIcon, DeleteIcon, RepeatIcon, ExternalLinkIcon, ChatIcon, ChevronLeftIcon, InfoIcon, ArrowUpIcon, ArrowDownIcon, CheckIcon, TimeIcon, StarIcon, AddIcon } from '@chakra-ui/icons';

// Statsig-inspired professional theme
const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
  fonts: {
    heading: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        fontWeight: '600',
        borderRadius: '4px',
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: '4px',
          fontWeight: '400',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          letterSpacing: '-0.01em',
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: '4px',
          fontWeight: '400',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          letterSpacing: '-0.01em',
        },
      },
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [detectedUrls, setDetectedUrls] = useState({ ui: null, api: null });
  const [selectedUrl, setSelectedUrl] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // GitHub integration + product insights (UI-only)
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubConnecting, setGithubConnecting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [availableRepos, setAvailableRepos] = useState([]);
  const [aiAgentMessages, setAiAgentMessages] = useState([]);

  // Accumulate raw runner output so we can show clean step-based status updates.
  const rawOutputRef = useRef('');
  const [postIndices, setPostIndices] = useState({
    reddit: 0,
    twitter: 0,
    hackernews: 0,
    techcrunch: 0,
    medium: 0,
    producthunt: 0
  });
  const [customSources, setCustomSources] = useState([]);
  const [newSourceForm, setNewSourceForm] = useState({
    name: '',
    url: '',
    color: '#6b7280'
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState('pmai'); // 'pmai' or 'chatbuddy'
  const [weakSignalMode, setWeakSignalMode] = useState(false);
  const [productInsightsLoading, setProductInsightsLoading] = useState(false);
  const [morningBriefIndex, setMorningBriefIndex] = useState(0);
  const morningBriefDays = [
    { date: 'Today', days: ['Today'] },
    { date: 'Yesterday', days: ['Yesterday'] },
    { date: '2 days ago', days: ['2 days ago'] },
    { date: '3 days ago', days: ['3 days ago'] },
    { date: '4-5 days ago', days: ['4 days ago', '5 days ago'] },
    { date: '6-7 days ago', days: ['6 days ago', '7 days ago'] }
  ];
  const [envContent, setEnvContent] = useState('');
  const { isOpen: isEnvModalOpen, onOpen: onEnvModalOpen, onClose: onEnvModalClose } = useDisclosure();

  // Simulate loading when Product Insights tab is opened or product is switched
  useEffect(() => {
    if (activeTab === 2) { // Product Insights tab index
      setProductInsightsLoading(true);
      const timer = setTimeout(() => {
        setProductInsightsLoading(false);
      }, 1800); // 1.8 seconds loading time
      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedProduct]);

  // Mock posts data for AI for Project Managers
  const pmaiRedditPosts = [
    {
      title: "Zeno is a game changer - saved me 10 hours this week!",
      content: '"Started using Zeno and it\'s incredible. The automated sprint planning and risk detection features are spot on. Anyone else seeing huge time savings? The insights are actually actionable."',
      upvotes: "3.2k",
      author: "u/pm_lead",
      time: "4h ago"
    },
    {
      title: "Feature request: Can we get Jira integration?",
      content: '"Love Zeno so far, but we really need Jira integration for our team. The team mentioned it\'s coming in Q2. Anyone else waiting for this?"',
      upvotes: "2.1k",
      author: "u/product_manager",
      time: "7h ago"
    },
    {
      title: "Bug report: Zeno suggestions sometimes miss context",
      content: '"Had an issue where Zeno missed some context in a complex project. Support was responsive and helped resolve it quickly. They said it\'s a known issue with multi-team projects. Still love the product though!"',
      upvotes: "1.5k",
      author: "u/tech_pm",
      time: "11h ago"
    }
  ];

  const pmaiTwitterPosts = [
    {
      content: "Just used @Zeno for sprint planning - saved 8 hours this week. The AI insights are actually useful, not just fluff. Highly recommend! 🚀",
      retweets: "2.4k",
      likes: "6.8k",
      time: "2h ago"
    },
    {
      content: "Our team integrated @Zeno last week. Project visibility increased 40% and stakeholders love the automated reports. Best decision we made this quarter. 📊",
      retweets: "1.8k",
      likes: "5.2k",
      time: "5h ago"
    },
    {
      content: "The risk detection in @Zeno is incredible. Caught 3 potential blockers before they became issues. Finally an AI tool that actually helps PMs! 🎯",
      retweets: "3.1k",
      likes: "7.5k",
      time: "1d ago"
    }
  ];

  const pmaiHackernewsPosts = [
    {
      title: "Show HN: Zeno - AI assistant for project managers - feedback welcome",
      content: "After 6 months of development, we launched Zeno with automated sprint planning and risk detection. We've helped 500+ PMs save 20+ hours per week. Would love the HN community's feedback.",
      points: "487",
      comments: "142",
      author: "pm_ai_builder",
      time: "1d ago"
    },
    {
      title: "Ask HN: Anyone using Zeno for project management? How's the accuracy?",
      content: "We're considering integrating Zeno for our team. The team claims it can predict risks and automate planning, but I want to hear from actual users. What's your experience with accuracy and reliability?",
      points: "356",
      comments: "203",
      author: "tech_pm_lead",
      time: "2d ago"
    },
    {
      title: "Review: Zeno saved us 200 hours last month",
      content: "We switched our entire project management workflow to Zeno. The time savings are real - went from 40 hours of planning per sprint to 8 hours. The automated insights are also super helpful for stakeholder updates.",
      points: "623",
      comments: "287",
      author: "startup_pm",
      time: "3d ago"
    }
  ];

  const pmaiTechcrunchPosts = [
    {
      title: "Zeno sees rapid adoption among tech companies",
      content: "Zeno, an AI-powered project management assistant, has gained significant traction, with over 200 companies integrating in the past month. Users report 50% time savings on planning and improved project visibility.",
      author: "Sarah Chen",
      time: "2d ago"
    },
    {
      title: "Zeno raises $15M Series A to expand enterprise features",
      content: "The funding will be used to add support for additional project management tools and improve the AI's predictive capabilities. Zeno currently integrates with Jira, Asana, and Linear.",
      author: "Michael Park",
      time: "4d ago"
    },
    {
      title: "Study confirms Zeno reduces project delays by 40%",
      content: "An independent study validated Zeno's risk prediction capabilities, confirming it can identify potential blockers before they impact timelines. The tool has helped manage over 1,000 projects successfully.",
      author: "Lisa Zhang",
      time: "1w ago"
    }
  ];

  const pmaiMediumPosts = [
    {
      title: "Why We Switched to Zeno: A Product Team's Journey",
      content: "After missing deadlines on 3 consecutive projects, we needed a better solution. Zeno's predictive analytics gave us the visibility we needed. Here's our full review.",
      author: "Alex Rivera",
      claps: "2.8k",
      readTime: "5 min read",
      time: "3d ago"
    },
    {
      title: "Integrating Zeno into Project Management: Lessons Learned",
      content: "We integrated Zeno into our workflow last month. The setup was smooth, but we hit some edge cases with complex dependencies. Here's what we learned and how the team helped us resolve issues.",
      author: "Jordan Kim",
      claps: "3.4k",
      readTime: "7 min read",
      time: "5d ago"
    },
    {
      title: "AI PM Tool Comparison: Why Zeno Stands Out",
      content: "We tested 5 different AI project management tools for our team. Zeno won on accuracy, time savings, and UX. The automated insights and risk detection are also top-notch. Here's our detailed comparison.",
      author: "Sam Patel",
      claps: "4.1k",
      readTime: "9 min read",
      time: "1w ago"
    }
  ];

  const pmaiProducthuntPosts = [
    {
      title: "Zeno - AI assistant for project managers",
      content: "Finally, an AI tool that actually helps PMs! Automated sprint planning, risk detection, and stakeholder updates. We've been using Zeno for 2 months and it's saved us 15+ hours per week.",
      upvotes: "1.2k",
      maker: "@pm_community",
      badge: "#1 Product of the Day"
    },
    {
      title: "Review: Best PM tool we've used so far",
      content: "Switched from 3 other PM tools to Zeno. The time savings alone justify the switch. Plus the AI insights are actually accurate. Highly recommend!",
      upvotes: "1.5k",
      maker: "@product_team",
      badge: "#2 Product of the Day"
    },
    {
      title: "Feature request: Add more integrations",
      content: "Love Zeno but we need more tool integrations. The team says it's coming. In the meantime, the existing integrations work perfectly. Great product overall!",
      upvotes: "987",
      maker: "@tech_pm",
      badge: "#3 Product of the Day"
    }
  ];

  // Mock posts data for Chat-Buddy (Prompt Engineering)
  const chatbuddyRedditPosts = [
    {
      title: "Chat-Buddy's prompt engineering is incredible - best responses I've seen!",
      content: '"Just started using Chat-Buddy and the AI responses are so much better than ChatGPT. The prompt engineering must be really well done. Anyone else noticing how natural the conversations feel?"',
      upvotes: "2.8k",
      author: "u/ai_enthusiast",
      time: "3h ago"
    },
    {
      title: "Feature request: Can we customize the system prompts?",
      content: '"Love Chat-Buddy but I want to customize the system prompts for my use case. The team mentioned they\'re working on prompt templates. Anyone else need this feature?"',
      upvotes: "1.9k",
      author: "u/prompt_engineer",
      time: "6h ago"
    },
    {
      title: "Bug report: Sometimes the AI forgets context mid-conversation",
      content: '"Had an issue where the AI lost context after 10 messages. Support said it\'s a known issue with long conversations and they\'re fixing it. Otherwise the prompt engineering is solid!"',
      upvotes: "1.2k",
      author: "u/chat_user",
      time: "10h ago"
    }
  ];

  const chatbuddyTwitterPosts = [
    {
      content: "Just tried @ChatBuddy and the prompt engineering is next level. The AI actually remembers context better than ChatGPT. The conversation flow feels so natural! 🤖",
      retweets: "1.8k",
      likes: "4.2k",
      time: "1h ago"
    },
    {
      content: "Our team integrated @ChatBuddy last month. User engagement increased 50% because the AI responses are so much more relevant. The prompt templates are a game changer. 🚀",
      retweets: "1.4k",
      likes: "3.8k",
      time: "4h ago"
    },
    {
      content: "Prompt engineering matters! @ChatBuddy shows how good prompts can make AI feel human. The system prompts are clearly well-crafted. Finally an AI that gets context! 💬",
      retweets: "2.3k",
      likes: "5.1k",
      time: "1d ago"
    }
  ];

  const chatbuddyHackernewsPosts = [
    {
      title: "Show HN: Chat-Buddy - AI chat with advanced prompt engineering",
      content: "Built a chat app with focus on prompt engineering. The system prompts are carefully crafted to maintain context and provide natural conversations. We've had 10k+ users with great feedback.",
      points: "412",
      comments: "128",
      author: "chatbuddy_dev",
      time: "1d ago"
    },
    {
      title: "Ask HN: How does Chat-Buddy's prompt engineering compare to ChatGPT?",
      content: "We're evaluating Chat-Buddy for our customer support. The responses seem more contextual. Anyone have experience comparing their prompt engineering approach?",
      points: "298",
      comments: "167",
      author: "support_lead",
      time: "2d ago"
    },
    {
      title: "Review: Chat-Buddy's prompt templates saved us 20 hours/week",
      content: "We use Chat-Buddy for internal documentation. The prompt engineering is so good that we barely need to edit responses. The context retention is impressive.",
      points: "534",
      comments: "203",
      author: "tech_writer",
      time: "3d ago"
    }
  ];

  const chatbuddyTechcrunchPosts = [
    {
      title: "Chat-Buddy sees rapid adoption with focus on prompt engineering",
      content: "A new AI chat application has gained traction by focusing on advanced prompt engineering. Users report 40% better response quality compared to standard ChatGPT implementations.",
      author: "Sarah Chen",
      time: "2d ago"
    },
    {
      title: "Chat-Buddy raises $8M to expand prompt engineering capabilities",
      content: "The funding will be used to develop more sophisticated prompt templates and improve context retention. The platform currently serves 50k+ active users.",
      author: "Michael Park",
      time: "4d ago"
    },
    {
      title: "How Chat-Buddy's prompt engineering is changing AI conversations",
      content: "By carefully crafting system prompts and maintaining conversation context, Chat-Buddy delivers more natural and relevant AI interactions. The approach is gaining attention from enterprise customers.",
      author: "Lisa Zhang",
      time: "1w ago"
    }
  ];

  const chatbuddyMediumPosts = [
    {
      title: "Why Prompt Engineering is the Secret to Better AI Conversations",
      content: "Chat-Buddy demonstrates how well-crafted prompts can dramatically improve AI response quality. The system prompts maintain context and deliver more natural interactions.",
      author: "Alex Rivera",
      claps: "2.1k",
      readTime: "6 min read",
      time: "3d ago"
    },
    {
      title: "Building Chat-Buddy: Lessons in Prompt Engineering",
      content: "After months of testing different prompt strategies, here's what we learned about creating system prompts that maintain context and deliver relevant responses.",
      author: "Jordan Kim",
      claps: "2.8k",
      readTime: "8 min read",
      time: "5d ago"
    },
    {
      title: "Chat-Buddy vs ChatGPT: A Prompt Engineering Comparison",
      content: "We tested both platforms extensively. Chat-Buddy's prompt engineering approach results in better context retention and more natural conversation flow. Here's our detailed analysis.",
      author: "Sam Patel",
      claps: "3.5k",
      readTime: "10 min read",
      time: "1w ago"
    }
  ];

  const chatbuddyProducthuntPosts = [
    {
      title: "Chat-Buddy - AI chat with advanced prompt engineering",
      content: "Finally, an AI chat that actually remembers context! The prompt engineering is incredible. We've been using it for customer support and it's been amazing.",
      upvotes: "1.1k",
      maker: "@chatbuddy_users",
      badge: "#1 Product of the Day"
    },
    {
      title: "Review: Best prompt engineering I've seen",
      content: "Switched from ChatGPT to Chat-Buddy. The difference in response quality is night and day. The system prompts are clearly well thought out. Highly recommend!",
      upvotes: "1.3k",
      maker: "@ai_developer",
      badge: "#2 Product of the Day"
    },
    {
      title: "Feature request: More prompt templates",
      content: "Love Chat-Buddy but we need more prompt templates for different use cases. The team says they're working on it. The existing templates work great though!",
      upvotes: "856",
      maker: "@prompt_master",
      badge: "#3 Product of the Day"
    }
  ];

  // Get posts based on selected product
  const getPosts = () => {
    if (selectedProduct === 'chatbuddy') {
      return {
        reddit: chatbuddyRedditPosts,
        twitter: chatbuddyTwitterPosts,
        hackernews: chatbuddyHackernewsPosts,
        techcrunch: chatbuddyTechcrunchPosts,
        medium: chatbuddyMediumPosts,
        producthunt: chatbuddyProducthuntPosts
      };
    }
    return {
      reddit: pmaiRedditPosts,
      twitter: pmaiTwitterPosts,
      hackernews: pmaiHackernewsPosts,
      techcrunch: pmaiTechcrunchPosts,
      medium: pmaiMediumPosts,
      producthunt: pmaiProducthuntPosts
    };
  };

  const navigatePost = (source, direction) => {
    setPostIndices(prev => {
      const currentIndex = prev[source];
      const posts = getPosts();
      const maxIndex = posts[source].length - 1;
      const newIndex = direction === 'next' 
        ? (currentIndex + 1) % (maxIndex + 1)
        : currentIndex === 0 ? maxIndex : currentIndex - 1;
      return { ...prev, [source]: newIndex };
    });
  };

  const handleAddSource = () => {
    if (!newSourceForm.name || !newSourceForm.url) {
      toast({
        title: 'Error',
        description: 'Please fill in both name and URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const sourceId = `custom_${Date.now()}`;
    const newSource = {
      id: sourceId,
      name: newSourceForm.name,
      url: newSourceForm.url,
      color: newSourceForm.color,
      posts: [
        {
          title: `Latest bridge insights from ${newSourceForm.name}`,
          content: `Tracking cross-chain bridge discussions and trends from ${newSourceForm.name}. This source is being monitored for relevant bridge protocol updates and security discussions.`,
          upvotes: "0",
          author: "system",
          time: "Just added"
        },
        {
          title: `Bridge community discussions on ${newSourceForm.name}`,
          content: `Users are actively discussing bridge features, security models, and cross-chain interoperability. Engagement is growing steadily.`,
          upvotes: "0",
          author: "system",
          time: "1h ago"
        },
        {
          title: `Bridge protocol updates from ${newSourceForm.name}`,
          content: `New bridge features, security improvements, and cross-chain announcements are being tracked. Stay tuned for the latest developments.`,
          upvotes: "0",
          author: "system",
          time: "2h ago"
        }
      ]
    };

    setCustomSources(prev => [...prev, newSource]);
    setPostIndices(prev => ({ ...prev, [sourceId]: 0 }));
    setNewSourceForm({ name: '', url: '', color: '#6b7280' });
    onClose();
    
    toast({
      title: 'Success',
      description: `Added ${newSourceForm.name} to tracked sources`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const navigateCustomPost = (sourceId, direction) => {
    const source = customSources.find(s => s.id === sourceId);
    if (!source) return;

    setPostIndices(prev => {
      const currentIndex = prev[sourceId] || 0;
      const maxIndex = source.posts.length - 1;
      const newIndex = direction === 'next' 
        ? (currentIndex + 1) % (maxIndex + 1)
        : currentIndex === 0 ? maxIndex : currentIndex - 1;
      return { ...prev, [sourceId]: newIndex };
    });
  };

  // Aider session/chat plumbing (aider_two)
  const [aiderSession, setAiderSession] = useState(null);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [aiderModel, setAiderModel] = useState(() => localStorage.getItem('zeno_aider_model') || 'openai/gpt-4o-mini');
  const [currentJobId, setCurrentJobId] = useState(null);
  const [syncErrorJobId, setSyncErrorJobId] = useState(null);
  const streamAbortRef = useRef(null);
  const sessionInitPromiseRef = useRef(null);
  const streamingAssistantIdxRef = useRef(-1);
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const chatEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const [formData, setFormData] = useState({
    repo: '',
    ref: 'main',
    workflow: 'run',
    service: 'all',
    publishUI: '',
    publishAPI: '',
    entry: '',
    dir: '',
    timeout: '10m'
  });

  const browserViewRef = useRef(null);
  const toast = useToast();

  // Transform raw output into simple status messages (abstracts away verbose logs)
  const formatOutput = (rawText) => {
    const statusMessages = [];
    const seen = new Set();
    
    const addStatus = (message) => {
      if (!seen.has(message)) {
        seen.add(message);
        statusMessages.push(message);
      }
    };
    
    // Step 1: Cloning repository
    if (rawText.match(/\[stderr\]\s*Cloning into/)) {
      addStatus('📦 Cloning repository...');
    }
    if (rawText.match(/\[stdout\]\s*Your branch is up to date/)) {
      addStatus('✓ Repository ready');
    }
    if (rawText.match(/\[warn\]\s*repo has local changes/)) {
      addStatus('⚠️ Using local changes');
    }
    if (rawText.match(/\[stderr\]\s*Already on/)) {
      addStatus('✓ Repository checked out');
    }
    
    // Step 2: Detecting project type
    const typeMatch = rawText.match(/\[info\]\s*detected project type:\s*(\w+)/);
    if (typeMatch) {
      const typeNames = {
        'electron': 'Electron app',
        'polyglot': 'Polyglot (Python + React)',
        'python': 'Python project',
        'node': 'Node.js project',
        'unknown': 'Unknown project type'
      };
      addStatus(`🔍 Detected: ${typeNames[typeMatch[1]] || typeMatch[1]}`);
    }
    
    // Step 3: Building Docker image
    if (rawText.match(/\[info\]\s*building runner image/)) {
      addStatus('🐳 Building Docker image...');
    }
    if (rawText.match(/\[stderr\]\s*#\d+\s+\[internal\]\s*load build definition/)) {
      addStatus('   Loading Dockerfile...');
    }
    if (rawText.match(/\[stderr\]\s*#\d+\s+\[internal\]\s*load metadata/)) {
      addStatus('   Fetching base image...');
    }
    if (rawText.match(/\[stderr\]\s*#\d+\s+\[.*\]\s*RUN.*apt-get update/)) {
      addStatus('   Installing system packages...');
    }
    // Docker build complete - look for the final DONE message
    if (rawText.match(/\[stderr\]\s*#\d+\s+\[.*\]\s*DONE\s+[\d.]+\s*$/m)) {
      addStatus('✓ Docker image ready');
    }
    
    // Step 4: Installing dependencies
    if (rawText.match(/\[stdout\]\s*npm install/)) {
      addStatus('📦 Installing dependencies...');
    }
    if (rawText.match(/\[stdout\]\s*added \d+ packages/)) {
      addStatus('   Installing npm packages...');
    }
    if (rawText.match(/\[stdout\]\s*audited \d+ packages/)) {
      addStatus('✓ Dependencies installed');
    }
    if (rawText.match(/\[stdout\]\s*pip install/)) {
      addStatus('   Installing Python packages...');
    }
    if (rawText.match(/\[stdout\]\s*Requirement already satisfied/)) {
      addStatus('   Python packages ready');
    }
    if (rawText.match(/\[stdout\]\s*Successfully installed/)) {
      addStatus('✓ Python packages installed');
    }
    
    // Step 5: Starting application
    if (rawText.match(/\[stdout\]\s*Starting backend/)) {
      addStatus('🚀 Starting application...');
    }
    if (rawText.match(/\[stdout\]\s*Starting frontend/)) {
      addStatus('   Starting frontend server...');
    }
    if (rawText.match(/\[stdout\]\s*Backend.*running/)) {
      addStatus('✓ Backend server ready');
    }
    if (rawText.match(/\[stdout\]\s*Frontend.*running/)) {
      addStatus('✓ Frontend server ready');
    }
    if (rawText.match(/\[stdout\]\s*Compiled successfully/)) {
      addStatus('✓ Frontend compiled');
    }
    if (rawText.match(/\[stdout\]\s*webpack compiled/)) {
      addStatus('✓ Bundles built');
    }
    if (rawText.match(/\[stdout\]\s*Local:\s*http/)) {
      addStatus('✓ Development server ready');
    }
    if (rawText.match(/\[stdout\]\s*Compiling/)) {
      addStatus('   Compiling frontend...');
    }
    if (rawText.match(/\[stdout\]\s*Starting the development server/)) {
      addStatus('   Starting development server...');
    }
    
    // Final status - URLs
    const uiMatch = rawText.match(/\[info\]\s*UI:\s*(http:\/\/localhost:\d+)/);
    if (uiMatch) {
      setDetectedUrls(prev => ({ ...prev, ui: uiMatch[1] }));
      addStatus(`✅ Ready at: ${uiMatch[1]}`);
    }
    
    const apiMatch = rawText.match(/\[info\]\s*API:\s*(http:\/\/localhost:\d+)/);
    if (apiMatch) {
      setDetectedUrls(prev => ({ ...prev, api: apiMatch[1] }));
      addStatus(`✅ API at: ${apiMatch[1]}`);
    }
    
    // Return status messages in order
    return statusMessages.join('\n');
  };

  const scrollChatToBottom = (behavior = 'smooth') => {
    // Prefer scrolling the container (more reliable than scrollIntoView in some Electron builds)
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior,
      });
      return;
    }
    // Fallback anchor scroll
    chatEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    localStorage.setItem('zeno_aider_model', aiderModel || '');
  }, [aiderModel]);

  useEffect(() => {
    // Auto-scroll as messages arrive (including streaming)
    scrollChatToBottom('auto');
  }, [chatMessages]);

  useEffect(() => {
    if (chatOpen) {
      // When opening the sidebar, jump to latest message
      setTimeout(() => scrollChatToBottom('auto'), 0);
    }
  }, [chatOpen]);

  useEffect(() => {
    return () => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    // Ensure electronAPI is available (wait for it if needed)
    const setupOutputListener = () => {
      if (window.electronAPI) {
        // Set up output listener
        window.electronAPI.onZenoOutput((data) => {
          const text = data.data;
          rawOutputRef.current += text;
          
          // Format the entire accumulated output to get proper step progression
          const formatted = formatOutput(rawOutputRef.current);
          setOutput(formatted);
          parseUrlsFromOutput(text);
        });
      } else {
        // Wait a bit for web-api.js to load (browser mode)
        setTimeout(setupOutputListener, 100);
      }
    };
    
    setupOutputListener();

    return () => {
      window.electronAPI?.removeZenoOutputListener();
      rawOutputRef.current = '';
    };
  }, []);


  const parseUrlsFromOutput = (text) => {
    const uiMatch = text.match(/\[info\]\s+UI:\s+(http:\/\/localhost:\d+)/i);
    const apiMatch = text.match(/\[info\]\s+API:\s+(http:\/\/localhost:\d+)/i);
    
    if (uiMatch) {
      setDetectedUrls(prev => ({ ...prev, ui: uiMatch[1] }));
    }
    
    if (apiMatch) {
      setDetectedUrls(prev => ({ ...prev, api: apiMatch[1] }));
    }
  };

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    
    // Auto-generate directory from repo URL whenever repo changes
    if (field === 'repo' && value) {
      // Extract repo name from various URL formats:
      // https://github.com/user/repo -> repo
      // https://github.com/user/repo.git -> repo
      // user/repo -> repo
      // git@github.com:user/repo.git -> repo
      let repoName = value.trim();
      
      // Remove .git suffix if present
      repoName = repoName.replace(/\.git$/, '');
      
      // Extract the last part after the last slash
      const parts = repoName.split('/');
      repoName = parts[parts.length - 1];
      
      // Remove any query params or fragments
      repoName = repoName.split('?')[0].split('#')[0];
      
      if (repoName) {
        updatedData.dir = `repos/${repoName}`;
      } else {
        updatedData.dir = '';
      }
    }
    
    setFormData(updatedData);
  };

  const handleToggleChat = () => {
    // Only open, don't toggle - it stays open until explicitly closed
    if (!chatOpen) {
      setChatOpen(true);
    }
  };

  const handleCloseChat = () => {
    setChatOpen(false);
  };

  const apiFetch = async (path, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const msg = typeof payload === 'string' ? payload : (payload?.detail ? JSON.stringify(payload.detail) : JSON.stringify(payload));
      throw new Error(`${res.status} ${res.statusText}: ${msg}`);
    }
    return payload;
  };

  const resolveRepoPath = async () => {
    const maybeDir = formData.dir || '';
    if (!maybeDir) throw new Error('Set a repo directory first (e.g. repos/chat-buddy)');
    const resp = await window.electronAPI?.resolvePath?.(maybeDir);
    if (!resp?.ok) throw new Error(resp?.error || 'Failed to resolve repo path');
    return resp.path;
  };

  const initializeSession = async () => {
    if (aiderSession) return aiderSession;
    if (sessionInitPromiseRef.current) return sessionInitPromiseRef.current;

    setIsInitializingSession(true);
    try {
      const p = (async () => {
        const repo_path = await resolveRepoPath();
        const base_ref = (formData.ref || 'HEAD').trim() || 'HEAD';
        return await apiFetch('/sessions', {
          method: 'POST',
          body: JSON.stringify({ repo_path, base_ref }),
        });
      })();

      sessionInitPromiseRef.current = p;
      const session = await p;

      setAiderSession(session);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Connected to ${session.workspace_path}` },
      ]);

      return session;
    } finally {
      setIsInitializingSession(false);
      sessionInitPromiseRef.current = null;
    }
  };

  const streamProductSummary = async (jobId) => {
    // cancel any previous stream
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }

    const controller = new AbortController();
    streamAbortRef.current = controller;

    // Product summary stream (live) emits plain-English summary chunks while the job runs.
    const response = await fetch(`${API_BASE_URL}/product/jobs/${encodeURIComponent(jobId)}/summary/live`, {
      headers: { Accept: 'text/event-stream' },
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Failed to connect to summary stream (${response.status})`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let summary = '';

    const setStreamingContent = (content) => {
      setChatMessages((prev) => {
        const idx = streamingAssistantIdxRef.current;
        if (idx < 0 || idx >= prev.length) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], content };
        return next;
      });
    };

    const tryParseJson = (s) => {
      try { return JSON.parse(s); } catch { return null; }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const lines = event.split('\n');
        let eventType = 'message';
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          else if (line.startsWith('data: ')) eventData += line.slice(6);
        }

        if (!eventData) continue;
        const parsed = tryParseJson(eventData);

        if (eventType === 'meta') {
          // Optional: surface meta as a small system note
          const status = parsed?.status ? `status=${parsed.status}` : '';
          const sync = parsed?.sync_status ? `sync=${parsed.sync_status}` : '';
          const line = [status, sync].filter(Boolean).join(' ');
          if (line) setChatMessages((prev) => [...prev, { role: 'assistant', content: line }]);
          continue;
        }

        if (eventType === 'summary') {
          const delta = (parsed && typeof parsed === 'object' && typeof parsed.text === 'string')
            ? parsed.text
            : (typeof eventData === 'string' ? eventData : String(eventData));
          summary += delta;
          setStreamingContent(summary.trim());
          continue;
        }

        if (eventType === 'error') {
          const errText = parsed?.error || (typeof eventData === 'string' ? eventData : String(eventData));
          summary += `\n\nError: ${errText}`;
          setStreamingContent(summary.trim());
          continue;
        }

        if (eventType === 'done') {
          return;
        }
      }
    }
  };

  const retrySync = async () => {
    if (!syncErrorJobId) return;
    const data = await apiFetch(`/jobs/${encodeURIComponent(syncErrorJobId)}/sync`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (data?.status === 'synced') {
      const fileCount = (data.files_updated?.length || 0) + (data.files_deleted?.length || 0);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `✓ Synced ${fileCount} file(s) to your repo` }]);
      setSyncErrorJobId(null);
    } else if (data?.status === 'no_changes') {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'No changes to sync' }]);
      setSyncErrorJobId(null);
    } else {
      throw new Error(data?.error || `Sync failed: ${data?.status || 'unknown'}`);
    }
  };

  const handleSendToAider = async () => {
    const messageText = chatInput.trim();
    if (!messageText) return;

    let session = aiderSession;
    if (!session) {
      session = await initializeSession();
    }
    if (!session?.session_id) {
      throw new Error('Session not initialized');
    }

    // Add user message + streaming assistant placeholder (match widget pattern)
    setChatMessages((prev) => {
      const next = [
        ...prev,
        { role: 'user', content: messageText },
        { role: 'assistant', content: '' },
      ];
      streamingAssistantIdxRef.current = next.length - 1;
      return next;
    });
    setChatInput('');

    const modelToSend = (aiderModel || '').trim();
    if (!modelToSend) {
      throw new Error("Set a model (e.g. openai/gpt-4o-mini, anthropic/claude-3-5-sonnet-20241022)");
    }

    const job = await apiFetch(`/sessions/${encodeURIComponent(session.session_id)}/edits`, {
      method: 'POST',
      body: JSON.stringify({ message: messageText, model: modelToSend }),
    });
    setCurrentJobId(job.job_id);

    await streamProductSummary(job.job_id);
    setCurrentJobId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRunning) return;

    rawOutputRef.current = '';
    setOutput('🚀 Starting workflow...\n');
    setDetectedUrls({ ui: null, api: null });
    setIsRunning(true);

    try {
      const result = await window.electronAPI.runZeno(formData);
      
      if (result.exitCode === 0) {
        toast({
          title: 'Success',
          description: 'Process completed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: `Process failed with exit code ${result.exitCode}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      await window.electronAPI.stopZeno();
      toast({
        title: 'Stopped',
        description: 'Process stopped by user',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setOutput('');
  };

  const handleUrlSelect = (url) => {
    setSelectedUrl(url);
    // webview src will update automatically via the src prop
  };

  const handleRefresh = () => {
    if (browserViewRef.current && selectedUrl) {
      try {
        browserViewRef.current.reload();
      } catch (e) {
        // Fallback: reload by setting src again
        const currentSrc = browserViewRef.current.src;
        browserViewRef.current.src = 'about:blank';
        setTimeout(() => {
          if (browserViewRef.current) {
            browserViewRef.current.src = currentSrc;
          }
        }, 100);
      }
    }
  };

  const handleOpenExternal = async () => {
    if (selectedUrl) {
      await window.electronAPI.openExternal(selectedUrl);
    }
  };

  const handlePushToGitHubPR = async () => {
    if (!githubConnected) {
      toast({
        title: 'GitHub not connected',
        description: 'Please connect to GitHub first.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Get repo directory - default to chat-buddy
    // Try to get from formData first, then from selectedRepo, then default to chat-buddy
    let repoDir = formData.dir;
    
    if (!repoDir && selectedRepo) {
      repoDir = `repos/${selectedRepo.name}`;
    }
    
    // Default to chat-buddy repository as specified
    if (!repoDir) {
      repoDir = 'repos/chat-buddy';
    }

    try {
      toast({
        title: 'Creating PR...',
        description: 'Pushing changes to GitHub and creating pull request.',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });

      const result = await window.electronAPI.pushToGitHubPR({
        repoDir: repoDir,
        prTitle: `Zeno: Automated changes - ${new Date().toLocaleDateString()}`,
        prBody: `This PR contains automated changes generated by Zeno.\n\n**Created:** ${new Date().toISOString()}\n**Service:** ${selectedUrl}`,
        commitMessage: `Zeno: Automated changes from ${new Date().toISOString()}`
      });

      if (result.success) {
        toast({
          title: 'PR Created Successfully!',
          description: `Pull request created: ${result.branchName}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Open PR in browser
        if (result.prUrl) {
          setTimeout(() => {
            window.electronAPI.openExternal(result.prUrl);
          }, 1000);
        }
      } else {
        toast({
          title: 'Failed to create PR',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create PR',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInjectEnv = async () => {
    // TODO: Implement .env injection functionality - save to local computer root
    console.log('Inject .env:', envContent);
    // Close modal after saving
    onEnvModalClose();
    setEnvContent('');
  };

  useEffect(() => {
    // Auto-select UI when detected
    if (detectedUrls.ui && !selectedUrl) {
      setSelectedUrl(detectedUrls.ui);
    }
  }, [detectedUrls.ui, selectedUrl]);

  // Close chat when switching away from Sandbox tab
  useEffect(() => {
    if (activeTab !== 1 && chatOpen) {
      setChatOpen(false);
    }
  }, [activeTab]);

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="#f9fafb" color="gray.800" position="relative" overflow="hidden">
        {/* Header - Dark header with logo, tabs, and status */}
        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="gray" isLazy>
          <Box
            bg="#1f2937"
            borderBottom="1px solid"
            borderColor="#374151"
            py={3}
            px={8}
          >
            <Container maxW="container.xl">
              <Flex align="center" justify="space-between" gap={6}>
                {/* Logo and name on left */}
                <Flex align="center" gap={3} flexShrink={0}>
                  <Box
                    w={9}
                    h={9}
                    bg="#4b5563"
                    borderRadius="3px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="lg"
                    fontWeight="700"
                    color="white"
                  >
                    Z
                  </Box>
                  <Box>
                    <Heading size="md" color="#f3f4f6" fontWeight="700" letterSpacing="-0.2px">
                      Zeno
                    </Heading>
                  </Box>
                </Flex>

                {/* Tabs in the middle */}
                <Box flex={1} display="flex" justifyContent="center">
                  <TabList borderBottom="none" gap={1}>
                <Tooltip label="Run the product" placement="bottom" hasArrow>
                  <Tab
                    fontWeight="500"
                    color="#d1d5db"
                    fontSize="sm"
                    px={4}
                    py={3}
                    mb="-1px"
                    borderBottom="2px solid transparent"
                    _selected={{ 
                      color: '#f9fafb', 
                      borderBottomColor: '#60a5fa',
                      fontWeight: '600'
                    }}
                    _hover={{ color: '#e5e7eb' }}
                  >
                    <HStack spacing={2}>
                      <Box
                        as="svg"
                        w={4}
                        h={4}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                      </Box>
                      <Text>Projects</Text>
                    </HStack>
                  </Tab>
                </Tooltip>
                <Tooltip label="Change + verify" placement="bottom" hasArrow>
                  <Tab
                    fontWeight="500"
                    color="#d1d5db"
                    fontSize="sm"
                    px={4}
                    py={3}
                    mb="-1px"
                    borderBottom="2px solid transparent"
                    _selected={{ 
                      color: '#f9fafb', 
                      borderBottomColor: '#60a5fa',
                      fontWeight: '600'
                    }}
                    _hover={{ color: '#e5e7eb' }}
                  >
                    <HStack spacing={2}>
                      <Box
                        as="svg"
                        w={4}
                        h={4}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </Box>
                      <Text>Sandbox</Text>
                    </HStack>
                  </Tab>
                </Tooltip>
                <Tooltip label="Measure + decide" placement="bottom" hasArrow>
                  <Tab
                    fontWeight="500"
                    color="#d1d5db"
                    fontSize="sm"
                    px={4}
                    py={3}
                    mb="-1px"
                    borderBottom="2px solid transparent"
                    _selected={{ 
                      color: '#f9fafb', 
                      borderBottomColor: '#60a5fa',
                      fontWeight: '600'
                    }}
                    _hover={{ color: '#e5e7eb' }}
                  >
                    <HStack spacing={2}>
                      <Box
                        as="svg"
                        w={4}
                        h={4}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                      </Box>
                      <Text>Insights</Text>
                    </HStack>
                  </Tab>
                </Tooltip>
                  </TabList>
                </Box>

                {/* GitHub status on right */}
                <HStack spacing={3} align="center" flexShrink={0}>
                  {githubConnected ? (
                    <HStack spacing={2} align="center">
                      <Text color="#f3f4f6" fontSize="sm" fontWeight="500">
                        Zeno AI
                      </Text>
                      <Box
                        as="svg"
                        w={5}
                        h={5}
                        fill="#f3f4f6"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </Box>
                    </HStack>
                  ) : (
                    <Text color="#9ca3af" fontSize="sm" fontWeight="500">
                      Connect Zeno AI to github
                    </Text>
                  )}
                </HStack>
              </Flex>
            </Container>
          </Box>

          <TabPanels>
            {/* Control Panel Tab */}
            <TabPanel p={0}>
              <Container maxW="container.xl" py={8} px={8}>
                <Grid templateColumns="1fr 1fr" gap={6} mb={6}>
                  {/* AI Agent & GitHub Connection */}
                  <Box 
                    bg="#ffffff" 
                    borderRadius="6px" 
                    p={6} 
                    border="1px solid" 
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                  >
                    <HStack mb={4} spacing={3}>
                      <Box
                        w={10}
                        h={10}
                        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        borderRadius="6px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <ChatIcon w={5} h={5} color="white" />
                      </Box>
                      <Box>
                        <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                          AI Agent
                        </Heading>
                        <Text color="#6b7280" fontSize="xs" fontWeight="500">
                          GitHub Integration
                        </Text>
                      </Box>
                    </HStack>

                    {!githubConnected ? (
                      <VStack spacing={4} align="stretch">
                        <Box
                          bg="#f9fafb"
                          borderRadius="4px"
                          p={4}
                          border="1px solid"
                          borderColor="#e5e7eb"
                        >
                          <Text color="#4b5563" fontSize="sm" lineHeight="1.6" mb={3}>
                            Connect the AI agent to GitHub to access your repositories and run workflows.
                          </Text>
                          <Button
                            onClick={() => {
                              setGithubConnecting(true);
                              setAiAgentMessages([{
                                role: 'agent',
                                content: 'Connecting to GitHub...',
                                timestamp: new Date()
                              }]);
                              // Simulate connection
                              setTimeout(() => {
                                setGithubConnecting(false);
                                setGithubConnected(true);
                                setAvailableRepos([
                                  { name: 'chat-buddy', fullName: 'stackman27/chat-buddy', description: 'AI-powered chat application with React frontend and Python backend', language: 'Python', stars: 187 },
                                  { name: 'zeno', fullName: 'stackman27/zeno', description: 'Zeno - Docker-based workflow runner with Electron UI for running repos', language: 'Go', stars: 42 },
                                ]);
                                setAiAgentMessages(prev => [...prev, {
                                  role: 'agent',
                                  content: 'Successfully connected to GitHub! Found 2 repositories.',
                                  timestamp: new Date()
                                }]);
                              }, 2000);
                            }}
                            bg="#4b5563"
                            color="white"
                            size="md"
                            width="100%"
                            isLoading={githubConnecting}
                            loadingText="Connecting..."
                            fontWeight="600"
                            _hover={{ bg: '#374151' }}
                          >
                            Connect to GitHub
                          </Button>
                        </Box>

                        {aiAgentMessages.length > 0 && (
                          <Box
                            bg="#1a1d23"
                            borderRadius="4px"
                            p={4}
                            maxH="200px"
                            overflowY="auto"
                          >
                            <VStack spacing={2} align="stretch">
                              {aiAgentMessages.map((msg, idx) => (
                                <Box key={idx}>
                                  <Text fontSize="xs" color="#9ca3af" mb={1}>
                                    AI Agent
                                  </Text>
                                  <Text fontSize="sm" color="#e5e7eb">
                                    {msg.content}
                                  </Text>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between" p={3} bg="#dcfce7" borderRadius="4px" border="1px solid" borderColor="#86efac">
                          <HStack spacing={2}>
                            <CheckIcon w={4} h={4} color="#16a34a" />
                            <Text fontSize="sm" fontWeight="600" color="#16a34a">
                              Connected to GitHub
                            </Text>
                          </HStack>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              setGithubConnected(false);
                              setSelectedRepo(null);
                              setAvailableRepos([]);
                              setAiAgentMessages([]);
                            }}
                            color="#6b7280"
                            _hover={{ bg: '#f3f4f6' }}
                          >
                            Disconnect
                          </Button>
                        </HStack>

                        <Box>
                          <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                            Select Repository
                          </FormLabel>
                          <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                            {availableRepos.map((repo) => (
                              <Box
                                key={repo.fullName}
                                p={3}
                                bg={selectedRepo?.fullName === repo.fullName ? '#f3f4f6' : '#f9fafb'}
                                borderRadius="4px"
                                border="1px solid"
                                borderColor={selectedRepo?.fullName === repo.fullName ? '#4b5563' : '#e5e7eb'}
                                cursor="pointer"
                                _hover={{ bg: '#f3f4f6', borderColor: '#9ca3af' }}
                                onClick={() => {
                                  setSelectedRepo(repo);
                                  setFormData(prev => ({ ...prev, repo: `https://github.com/${repo.fullName}` }));
                                  setAiAgentMessages(prev => [...prev, {
                                    role: 'agent',
                                    content: `Selected repository: ${repo.fullName}. Ready to run workflow.`,
                                    timestamp: new Date()
                                  }]);
                                }}
                              >
                                <HStack justify="space-between" mb={1}>
                                  <Text fontSize="sm" fontWeight="600" color="#111827">
                                    {repo.name}
                                  </Text>
                                  <HStack spacing={2}>
                                    <Badge bg="#e5e7eb" color="#4b5563" px={2} py={0.5} borderRadius="3px" fontSize="xs">
                                      {repo.language}
                                    </Badge>
                                    <Text fontSize="xs" color="#6b7280">
                                      ⭐ {repo.stars}
                                    </Text>
                                  </HStack>
                                </HStack>
                                <Text fontSize="xs" color="#6b7280">
                                  {repo.description}
                                </Text>
                                <Text fontSize="xs" color="#9ca3af" mt={1}>
                                  {repo.fullName}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                        </Box>

                        {selectedRepo && (
                          <Box
                            bg="#f9fafb"
                            borderRadius="4px"
                            p={4}
                            border="1px solid"
                            borderColor="#e5e7eb"
                          >
                            <HStack mb={3} justify="space-between">
                              <Text fontSize="sm" fontWeight="600" color="#111827">
                                Selected: {selectedRepo.name}
                              </Text>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setSelectedRepo(null)}
                                color="#6b7280"
                                _hover={{ bg: '#e5e7eb' }}
                              >
                                Clear
                              </Button>
                            </HStack>
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                handleSubmit(e);
                              }}
                              bg="#4b5563"
                              color="white"
                              size="md"
                              width="100%"
                              leftIcon={<ChevronRightIcon />}
                              isLoading={isRunning}
                              loadingText="Running..."
                              fontWeight="600"
                              _hover={{ bg: '#374151' }}
                              _active={{ bg: '#1f2937' }}
                            >
                              Run Workflow
                            </Button>
                          </Box>
                        )}

                        {aiAgentMessages.length > 0 && (
                          <Box
                            bg="#1a1d23"
                            borderRadius="4px"
                            p={4}
                            maxH="200px"
                            overflowY="auto"
                          >
                            <VStack spacing={2} align="stretch">
                              {aiAgentMessages.map((msg, idx) => (
                                <Box key={idx}>
                                  <Text fontSize="xs" color="#9ca3af" mb={1}>
                                    AI Agent
                                  </Text>
                                  <Text fontSize="sm" color="#e5e7eb">
                                    {msg.content}
                                  </Text>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    )}
                  </Box>

                  {/* Workflow Configuration */}
                  <Box 
                    bg="#ffffff" 
                    borderRadius="6px" 
                    p={6} 
                    border="1px solid" 
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                  >
                    <Heading size="md" mb={1} color="#111827" fontWeight="700" letterSpacing="-0.1px">
                      Workflow Configuration
                    </Heading>
                    <Text color="#6b7280" mb={6} fontSize="sm" fontWeight="500">
                      Configure workflow settings
                    </Text>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                          Git Ref
                        </FormLabel>
                        <Input
                          value={formData.ref}
                          onChange={(e) => handleInputChange('ref', e.target.value)}
                          placeholder="main"
                          bg="#ffffff"
                          borderColor="#d1d5db"
                          borderWidth="1px"
                          size="md"
                          color="#111827"
                          fontSize="14px"
                          fontWeight="400"
                          letterSpacing="-0.01em"
                          _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                          _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                          _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                          Workflow
                        </FormLabel>
                        <Select
                          value={formData.workflow}
                          onChange={(e) => handleInputChange('workflow', e.target.value)}
                          bg="#ffffff"
                          borderColor="#d1d5db"
                          borderWidth="1px"
                          size="md"
                          color="#111827"
                          fontSize="14px"
                          fontWeight="400"
                          letterSpacing="-0.01em"
                          _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                          _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                          _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                        >
                          <option value="run">Run</option>
                          <option value="test">Test</option>
                          <option value="lint">Lint</option>
                          <option value="build">Build</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                          Service
                        </FormLabel>
                        <Select
                          value={formData.service}
                          onChange={(e) => handleInputChange('service', e.target.value)}
                          bg="#ffffff"
                          borderColor="#d1d5db"
                          borderWidth="1px"
                          size="md"
                          color="#111827"
                          fontSize="14px"
                          fontWeight="400"
                          letterSpacing="-0.01em"
                          _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                          _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                          _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                        >
                          <option value="all">All</option>
                          <option value="ui">UI</option>
                          <option value="api">API</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                          Environment Variables
                        </FormLabel>
                        <Button
                          type="button"
                          size="md"
                          width="100%"
                          bg="#4b5563"
                          color="white"
                          onClick={onEnvModalOpen}
                          fontWeight="600"
                          _hover={{ bg: '#374151' }}
                          leftIcon={
                            <Box
                              as="svg"
                              w={4}
                              h={4}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                            </Box>
                          }
                        >
                          Inject .env
                        </Button>
                      </FormControl>

                      <Box pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <ButtonGroup spacing={3} width="100%">
                          <Button
                            type="button"
                            colorScheme="red"
                            size="md"
                            leftIcon={<CloseIcon />}
                            onClick={handleStop}
                            isDisabled={!isRunning}
                            fontWeight="600"
                            flex={1}
                          >
                            Stop
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            leftIcon={<DeleteIcon />}
                            onClick={handleClear}
                            fontWeight="600"
                            color="gray.500"
                            _hover={{ bg: '#e8e9ea', color: 'gray.700' }}
                            flex={1}
                          >
                            Clear
                          </Button>
                        </ButtonGroup>
                      </Box>
                    </VStack>
                  </Box>
                </Grid>

                {/* Inject .env Modal */}
                <Modal isOpen={isEnvModalOpen} onClose={onEnvModalClose} size="lg">
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Inject Environment Variables</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <VStack spacing={4} align="stretch">
                        <Box
                          bg="#fef3c7"
                          border="1px solid"
                          borderColor="#fbbf24"
                          borderRadius="4px"
                          p={3}
                        >
                          <Text fontSize="sm" color="#92400e" fontWeight="500" mb={1}>
                            ℹ️ Local Storage Notice
                          </Text>
                          <Text fontSize="xs" color="#78350f" lineHeight="1.5">
                            Environment variables will be stored locally on your computer. Zeno will only read the .env file from your local computer root directory.
                          </Text>
                        </Box>
                        <FormControl>
                          <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                            Environment Variables (.env format)
                          </FormLabel>
                          <Textarea
                            value={envContent}
                            onChange={(e) => setEnvContent(e.target.value)}
                            placeholder="API_KEY=your_key_here&#10;DATABASE_URL=your_url_here&#10;SECRET_KEY=your_secret_here"
                            bg="#ffffff"
                            borderColor="#d1d5db"
                            borderWidth="1px"
                            size="md"
                            color="#111827"
                            fontSize="14px"
                            fontWeight="400"
                            fontFamily="mono"
                            minH="200px"
                            _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                            _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                            _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                          />
                          <Text fontSize="xs" color="#6b7280" mt={2}>
                            Enter environment variables in KEY=VALUE format, one per line
                          </Text>
                        </FormControl>
                      </VStack>
                    </ModalBody>
                    <ModalFooter>
                      <ButtonGroup spacing={3}>
                        <Button
                          variant="ghost"
                          onClick={onEnvModalClose}
                          fontWeight="600"
                          color="gray.500"
                          _hover={{ bg: '#e8e9ea', color: 'gray.700' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          bg="#4b5563"
                          color="white"
                          onClick={handleInjectEnv}
                          fontWeight="600"
                          _hover={{ bg: '#374151' }}
                        >
                          Save .env
                        </Button>
                      </ButtonGroup>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

                {/* Output Section - Statsig-inspired */}
                <Box 
                  bg="#fafbfb" 
                  borderRadius="4px" 
                  p={8} 
                  border="1px solid" 
                  borderColor="#d8d9da"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.03)"
                  h="500px" 
                  display="flex" 
                  flexDirection="column"
                >
                  <Flex align="center" justify="space-between" mb={4}>
                    <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                      Output
                    </Heading>
                    {output && (
                      <Badge 
                        bg="#f3f4f6" 
                        color="#4b5563" 
                        px={2.5} 
                        py={1} 
                        borderRadius="3px" 
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {output.split('\n').filter(l => l.trim()).length} lines
                      </Badge>
                    )}
                  </Flex>
                  <Box
                    flex={1}
                    bg="#ffffff"
                    borderRadius="3px"
                    p={6}
                    overflowY="auto"
                    border="1px solid"
                    borderColor="#e5e7eb"
                    lineHeight="1.8"
                  >
                    {output ? (
                      <VStack align="stretch" spacing={3}>
                        {output.split('\n').filter(line => line.trim()).map((line, idx) => (
                          <HStack key={idx} align="flex-start" spacing={3}>
                            <Box flexShrink={0} mt={0.5}>
                              {line.includes('✓') && <Text color="#16a34a" fontSize="sm">✓</Text>}
                              {line.includes('⚠️') && <Text color="#f59e0b" fontSize="sm">⚠️</Text>}
                              {line.includes('❌') && <Text color="#dc2626" fontSize="sm">❌</Text>}
                              {!line.includes('✓') && !line.includes('⚠️') && !line.includes('❌') && (
                                <Text color="#6b7280" fontSize="sm">
                                  {line.match(/^[📦🔍🐳🚀✅]/)?.[0] || '•'}
                                </Text>
                              )}
                            </Box>
                            <Text 
                              color="#374151" 
                              fontSize="sm" 
                              fontWeight={line.includes('✅') ? '600' : '400'}
                              flex={1}
                            >
                              {line.replace(/^[📦🔍🐳🚀✅⚠️❌✓]\s*/, '')}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    ) : (
                      <Text color="#9ca3af" fontSize="sm">
                        No status yet. Run a workflow to see progress here.
                      </Text>
                    )}
                  </Box>
                </Box>
              </Container>
            </TabPanel>

            {/* Browser Tab - Full screen with compact navbar */}
            <TabPanel p={0}>
              <Box h="calc(100vh - 140px)" display="flex" flexDirection="column" bg="#f0f1f2">
                {/* Compact Navbar - Dark */}
                <Box 
                  bg="#374151" 
                  px={6} 
                  py={3} 
                  borderBottom="1px solid" 
                  borderColor="#4b5563"
                  display="flex"
                  alignItems="center"
                  gap={4}
                  flexShrink={0}
                >
                  <FormControl maxW="180px">
                    <Select
                      placeholder="Select service..."
                      value={selectedUrl}
                      onChange={(e) => handleUrlSelect(e.target.value)}
                      bg="#1f2937"
                      borderColor="#4b5563"
                      borderWidth="1px"
                      size="sm"
                      color="#f3f4f6"
                      fontSize="sm"
                      _hover={{ borderColor: '#6b7280', bg: '#374151' }}
                      _focus={{ borderColor: '#60a5fa', boxShadow: '0 0 0 3px rgba(96, 165, 250, 0.2)', bg: '#1f2937' }}
                    >
                      {detectedUrls.ui && (
                        <option value={detectedUrls.ui}>UI</option>
                      )}
                      {detectedUrls.api && (
                        <option value={detectedUrls.api}>API</option>
                      )}
                    </Select>
                  </FormControl>

                  <Box flex={1} minW={0}>
                    <Code
                      bg="#1f2937"
                      color="#d1d5db"
                      px={3}
                      py={1.5}
                      borderRadius="3px"
                      fontSize="xs"
                      fontFamily="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
                      border="1px solid"
                      borderColor="#4b5563"
                      display="block"
                      w="100%"
                      fontWeight="400"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {selectedUrl || 'No URL selected'}
                    </Code>
                  </Box>

                  <HStack spacing={1}>
                    {detectedUrls.ui && (
                      <Badge 
                        bg={selectedUrl === detectedUrls.ui ? '#60a5fa' : '#4b5563'}
                        color={selectedUrl === detectedUrls.ui ? 'white' : '#d1d5db'}
                        px={2}
                        py={0.5}
                        borderRadius="3px"
                        fontSize="xs"
                        fontWeight="600"
                        cursor="pointer"
                        onClick={() => handleUrlSelect(detectedUrls.ui)}
                      >
                        UI
                      </Badge>
                    )}
                    {detectedUrls.api && (
                      <Badge 
                        bg={selectedUrl === detectedUrls.api ? '#60a5fa' : '#4b5563'}
                        color={selectedUrl === detectedUrls.api ? 'white' : '#d1d5db'}
                        px={2}
                        py={0.5}
                        borderRadius="3px"
                        fontSize="xs"
                        fontWeight="600"
                        cursor="pointer"
                        onClick={() => handleUrlSelect(detectedUrls.api)}
                      >
                        API
                      </Badge>
                    )}
                  </HStack>

                  <HStack spacing={1}>
                    <IconButton
                      icon={<RepeatIcon />}
                      onClick={handleRefresh}
                      isDisabled={!selectedUrl}
                      variant="ghost"
                      size="sm"
                      aria-label="Refresh"
                      color="#d1d5db"
                      _hover={{ bg: '#4b5563', color: '#f3f4f6' }}
                    />
                    <IconButton
                      icon={<ExternalLinkIcon />}
                      onClick={handleOpenExternal}
                      isDisabled={!selectedUrl}
                      variant="ghost"
                      size="sm"
                      aria-label="Open in external browser"
                      color="#d1d5db"
                      _hover={{ bg: '#4b5563', color: '#f3f4f6' }}
                    />
                    <Button
                      leftIcon={
                        <Box
                          as="svg"
                          w={4}
                          h={4}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </Box>
                      }
                      onClick={handlePushToGitHubPR}
                      isDisabled={!githubConnected}
                      variant="ghost"
                      size="sm"
                      color="#d1d5db"
                      fontWeight="500"
                      fontSize="sm"
                      _hover={{ bg: '#4b5563', color: '#f3f4f6' }}
                    >
                      Push to GitHub PR
                    </Button>
                  </HStack>
                </Box>

                {/* Full Screen Browser View */}
                <Box 
                  flex={1} 
                  bg="white" 
                  position="relative" 
                  minH={0}
                  overflow="hidden"
                >
                  {selectedUrl ? (
                    <Box
                      position="relative"
                      w="100%"
                      h="100%"
                      transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      width={chatOpen ? 'calc(100% - 400px)' : '100%'}
                    >
                      <webview
                        ref={browserViewRef}
                        src={selectedUrl}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </Box>
                  ) : (
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      bg="#f3f4f6"
                      position="relative"
                      transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      width={chatOpen ? 'calc(100% - 400px)' : '100%'}
                    >
                      <Box
                        w={16}
                        h={16}
                        bg="#e5e7eb"
                        borderRadius="3px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        mb={4}
                      >
                        <ExternalLinkIcon w={8} h={8} color="#6b7280" />
                      </Box>
                      <Text fontSize="lg" fontWeight="600" color="#4b5563" mb={2}>
                        No Service Selected
                      </Text>
                      <Text fontSize="sm" color="#6b7280" fontWeight="400">
                        Run a workflow to see services here
                      </Text>
                    </Box>
                  )}
                  
                  {/* AI Assistant Sidebar - Slides in from right, overlays both webview and empty state */}
                  <Box
                    position="absolute"
                    right={chatOpen ? 0 : '-400px'}
                    top="0"
                    bottom="0"
                    w="400px"
                    bg="#ffffff"
                    borderLeft="1px solid"
                    borderColor="#e5e7eb"
                    display="flex"
                    flexDirection="column"
                    zIndex={100}
                    boxShadow="-2px 0 16px rgba(0, 0, 0, 0.1)"
                    transition="right 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    overflow="hidden"
                  >
                {/* Chat Header - Dark */}
                <Box
                  px={4}
                  py={3}
                  borderBottom="1px solid"
                  borderColor="#4b5563"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  bg="#374151"
                  flexShrink={0}
                >
                  <HStack spacing={2}>
                    <Text fontSize="md" color="#f3f4f6" fontWeight="600">
                      AI Assistant
                    </Text>
                    {chatMessages.length > 0 && (
                      <Badge
                        bg="#4b5563"
                        color="#d1d5db"
                        px={2}
                        py={0.5}
                        borderRadius="3px"
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {chatMessages.length}
                      </Badge>
                    )}
                  </HStack>
                  <IconButton
                    icon={<CloseIcon />}
                    onClick={handleCloseChat}
                    variant="ghost"
                    size="sm"
                    aria-label="Close chat"
                    color="#d1d5db"
                    _hover={{ bg: '#4b5563', color: '#f3f4f6' }}
                  />
                </Box>

                {/* Chat Messages */}
                <Box
                  flex={1}
                  overflowY="auto"
                  p={6}
                  display="flex"
                  flexDirection="column"
                  gap={4}
                  bg="#f9fafb"
                >
                  {chatMessages.length === 0 ? (
                    <Box textAlign="center" py={16}>
                      <Text color="#6b7280" fontSize="md" fontWeight="500" mb={2}>
                        Ask for changes to your application
                      </Text>
                      <Text color="#9ca3af" fontSize="sm">
                        Type a message below to get started
                      </Text>
                    </Box>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <Box
                        key={idx}
                        alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                        maxW="85%"
                      >
                        <Box
                          bg={msg.role === 'user' ? '#4b5563' : '#e5e7eb'}
                          color={msg.role === 'user' ? 'white' : '#374151'}
                          px={4}
                          py={3}
                          borderRadius="6px"
                          fontSize="sm"
                          lineHeight="1.6"
                        >
                          <Text>{msg.content}</Text>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Chat Input */}
                <Box
                  px={4}
                  py={4}
                  borderTop="1px solid"
                  borderColor="#e5e7eb"
                  bg="#ffffff"
                  flexShrink={0}
                >
                  <HStack spacing={3}>
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask for changes..."
                      bg="#ffffff"
                      borderColor="#d1d5db"
                      borderWidth="1px"
                      size="md"
                      fontSize="14px"
                      fontWeight="400"
                      letterSpacing="-0.01em"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatInput.trim()) {
                          const newMessage = { role: 'user', content: chatInput };
                          setChatMessages([...chatMessages, newMessage]);
                          setChatInput('');
                          // TODO: Send to AI and get response
                        }
                      }}
                      _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                      _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                      _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                    />
                    <Button
                      size="md"
                      bg="#4b5563"
                      color="white"
                      onClick={() => {
                        if (chatInput.trim()) {
                          const newMessage = { role: 'user', content: chatInput };
                          setChatMessages([...chatMessages, newMessage]);
                          setChatInput('');
                          // TODO: Send to AI and get response
                        }
                      }}
                      isDisabled={!chatInput.trim()}
                      _hover={{ bg: '#374151' }}
                      fontWeight="600"
                      px={6}
                    >
                      Send
                    </Button>
                  </HStack>
                </Box>
                  </Box>
                </Box>
              </Box>
            </TabPanel>

            {/* Product Insights Tab */}
            <TabPanel p={0}>
              {productInsightsLoading ? (
                <Center h="calc(100vh - 200px)" flexDirection="column">
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="#4b5563"
                    size="xl"
                    mb={4}
                  />
                  <Text color="#6b7280" fontSize="sm" fontWeight="500">
                    Fetching product insights...
                  </Text>
                </Center>
              ) : (
                <Container maxW="container.xl" py={8} px={8}>
                  <Box mb={8}>
                  <HStack spacing={3} mb={4} justify="space-between">
                    <HStack spacing={3}>
                      <Box
                        w={10}
                        h={10}
                        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        borderRadius="6px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <InfoIcon w={5} h={5} color="white" />
                      </Box>
                      <Box>
                        <Heading size="lg" color="#111827" fontWeight="700" letterSpacing="-0.2px" mb={1}>
                          Product Insights
                        </Heading>
                        <Text color="#6b7280" fontSize="sm" fontWeight="400">
                          Track performance, monitor trends, and stay ahead of the curve
                        </Text>
                      </Box>
                    </HStack>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        onClick={() => setSelectedProduct('pmai')}
                        bg={selectedProduct === 'pmai' ? '#4b5563' : '#f3f4f6'}
                        color={selectedProduct === 'pmai' ? 'white' : '#4b5563'}
                        fontWeight="600"
                        _hover={{ bg: selectedProduct === 'pmai' ? '#374151' : '#e5e7eb' }}
                      >
                        Zeno
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedProduct('chatbuddy')}
                        bg={selectedProduct === 'chatbuddy' ? '#4b5563' : '#f3f4f6'}
                        color={selectedProduct === 'chatbuddy' ? 'white' : '#4b5563'}
                        fontWeight="600"
                        _hover={{ bg: selectedProduct === 'chatbuddy' ? '#374151' : '#e5e7eb' }}
                      >
                        Chat-Buddy
                      </Button>
                    </HStack>
                  </HStack>
                </Box>

                {/* Morning Brief - Daily Digest */}
                <Box mb={10}>
                  <HStack mb={5} spacing={2} justify="space-between">
                    <HStack spacing={2}>
                      <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                        Morning Brief
                      </Heading>
                      <Badge
                        bg="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                        color="white"
                        px={2.5}
                        py={1}
                        borderRadius="4px"
                        fontSize="xs"
                        fontWeight="700"
                      >
                        {morningBriefDays[morningBriefIndex]?.date || 'Today'}
                      </Badge>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge bg="#dcfce7" color="#16a34a" px={2.5} py={1} borderRadius="4px" fontSize="xs" fontWeight="600">
                        Review Streak: 7 days
                      </Badge>
                    </HStack>
                  </HStack>
                  <Box position="relative">
                    <HStack spacing={2} mb={4} justify="flex-end">
                      <IconButton
                        icon={<ChevronLeftIcon />}
                        onClick={() => setMorningBriefIndex(Math.max(0, morningBriefIndex - 1))}
                        isDisabled={morningBriefIndex === 0}
                        size="sm"
                        variant="ghost"
                        aria-label="Previous slide"
                        color="#6b7280"
                        _hover={{ bg: '#f3f4f6', color: '#111827' }}
                      />
                      <Text fontSize="xs" color="#6b7280" fontWeight="500">
                        {morningBriefIndex + 1} / {morningBriefDays.length}
                      </Text>
                      <IconButton
                        icon={<ChevronRightIcon />}
                        onClick={() => setMorningBriefIndex(Math.min(morningBriefDays.length - 1, morningBriefIndex + 1))}
                        isDisabled={morningBriefIndex === morningBriefDays.length - 1}
                        size="sm"
                        variant="ghost"
                        aria-label="Next slide"
                        color="#6b7280"
                        _hover={{ bg: '#f3f4f6', color: '#111827' }}
                      />
                    </HStack>
                    {/* Today */}
                    <Box display={morningBriefIndex === 0 ? 'block' : 'none'}>
                      <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
                        <Box bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#10b981" boxShadow="0 2px 8px 0 rgba(16, 185, 129, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#10b981" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">METRIC</Badge>
                            <Badge bg="#ffffff" color="#10b981" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">+18%</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'New Projects Created' : 'Active Conversations'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? '234 new projects created today. 18% increase from yesterday. Strong adoption from enterprise teams.'
                              : '1,892 active conversations today. 18% growth driven by new prompt templates feature.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#10b981">Today</Text>
                            <Text>•</Text>
                            <Text>234 → 276</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#ef4444" boxShadow="0 2px 8px 0 rgba(239, 68, 68, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#ef4444" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">ISSUE</Badge>
                            <Badge bg="#ffffff" color="#ef4444" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Resolved</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'API Response Time Spike' : 'Context Memory Bug'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'API response time increased to 2.3s (avg 0.8s). Fixed at 3:42 PM. Root cause: database query optimization needed.'
                              : 'Context loss reported by 12 users. Fixed at 2:15 PM. Patch deployed successfully.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#ef4444">Resolved today</Text>
                            <Text>•</Text>
                            <Text>12 users affected</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#3b82f6" boxShadow="0 2px 8px 0 rgba(59, 130, 246, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#3b82f6" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">FEATURE</Badge>
                            <Badge bg="#ffffff" color="#3b82f6" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Launched</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Smart Risk Alerts' : 'Voice Input Beta'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'AI-powered risk detection launched to 50 beta teams. Initial feedback: 4.6/5 stars.'
                              : 'Voice-to-text input feature released to beta users. 89% positive feedback in first 6 hours.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#3b82f6">Launched today</Text>
                            <Text>•</Text>
                            <Text>50 teams</Text>
                          </HStack>
                        </Box>
                      </Grid>
                    </Box>
                    {/* Yesterday */}
                    <Box display={morningBriefIndex === 1 ? 'block' : 'none'}>
                      <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
                        <Box bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#10b981" boxShadow="0 2px 8px 0 rgba(16, 185, 129, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#10b981" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">GROWTH</Badge>
                            <Badge bg="#ffffff" color="#10b981" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">+12%</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Weekly Active Teams' : 'Daily Active Users'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Weekly active teams increased 12% yesterday. 156 new teams onboarded. Strong enterprise adoption.'
                              : 'DAU grew 12% yesterday. 1,234 new users signed up. Prompt templates driving engagement.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#10b981">Yesterday</Text>
                            <Text>•</Text>
                            <Text>1,234 → 1,382</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#f59e0b" boxShadow="0 2px 8px 0 rgba(245, 158, 11, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#f59e0b" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">COMPETITOR</Badge>
                            <Badge bg="#ffffff" color="#f59e0b" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Update</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Asana: New AI Features' : 'ChatGPT: Prompt Marketplace'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Asana announced AI sprint planning features. Pricing: $12/user/month. 3 enterprise customers migrated.'
                              : 'ChatGPT launched prompt marketplace. 45 users mentioned considering switch. Monitor closely.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#f59e0b">Yesterday</Text>
                            <Text>•</Text>
                            <Text>3 customers</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#9333ea" boxShadow="0 2px 8px 0 rgba(147, 51, 234, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#9333ea" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">TREND</Badge>
                            <Badge bg="#ffffff" color="#9333ea" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Emerging</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Jira Integration Requests' : 'Multi-Agent Workflows'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? '28 requests for Jira integration yesterday. High priority from enterprise customers. Consider accelerating roadmap.'
                              : '23 users exploring multi-agent setups. Strong signal from power users. Feature request trending.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#9333ea">Yesterday</Text>
                            <Text>•</Text>
                            <Text>28 requests</Text>
                          </HStack>
                        </Box>
                      </Grid>
                    </Box>
                    {/* 2 days ago */}
                    <Box display={morningBriefIndex === 2 ? 'block' : 'none'}>
                      <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
                        <Box bg="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#3b82f6" boxShadow="0 2px 8px 0 rgba(59, 130, 246, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#3b82f6" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">FEATURE</Badge>
                            <Badge bg="#ffffff" color="#3b82f6" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Shipped</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Automated Sprint Planning' : 'Prompt Templates Library'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'AI-powered sprint planning feature shipped. 78% adoption in first 24h. User satisfaction: 4.6/5.'
                              : 'Prompt templates library launched. 1,234 templates created by community. 89% positive feedback.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#3b82f6">2 days ago</Text>
                            <Text>•</Text>
                            <Text>78% adoption</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#ef4444" boxShadow="0 2px 8px 0 rgba(239, 68, 68, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#ef4444" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">ISSUE</Badge>
                            <Badge bg="#ffffff" color="#ef4444" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Fixed</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Database Performance' : 'Memory Leak'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Database query slowdown detected. Average response time: 1.8s. Fixed with query optimization. All systems stable.'
                              : 'Memory leak in conversation handler. Fixed with garbage collection improvements. No user impact.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#ef4444">2 days ago</Text>
                            <Text>•</Text>
                            <Text>Fixed</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#10b981" boxShadow="0 2px 8px 0 rgba(16, 185, 129, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#10b981" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">METRIC</Badge>
                            <Badge bg="#ffffff" color="#10b981" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">+15%</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'User Engagement' : 'Conversation Quality'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'User engagement up 15% from previous day. Average session time: 24 minutes. Feature adoption driving growth.'
                              : 'Conversation quality score improved 15%. Average response relevance: 92%. New templates performing well.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#10b981">2 days ago</Text>
                            <Text>•</Text>
                            <Text>15% increase</Text>
                          </HStack>
                        </Box>
                      </Grid>
                    </Box>
                    {/* 3 days ago */}
                    <Box display={morningBriefIndex === 3 ? 'block' : 'none'}>
                      <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
                        <Box bg="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#3b82f6" boxShadow="0 2px 8px 0 rgba(59, 130, 246, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#3b82f6" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">OPPORTUNITY</Badge>
                            <Badge bg="#ffffff" color="#3b82f6" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">High</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Enterprise Onboarding' : 'API Integration Requests'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? '3 enterprise customers signed up. Total ARR impact: $45k. Strong interest from Fortune 500 companies.'
                              : '45 API integration requests. High demand for programmatic access. Consider prioritizing API v2 development.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#3b82f6">3 days ago</Text>
                            <Text>•</Text>
                            <Text>$45k ARR</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#f59e0b" boxShadow="0 2px 8px 0 rgba(245, 158, 11, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#f59e0b" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">ALERT</Badge>
                            <Badge bg="#ffffff" color="#f59e0b" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Monitor</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Churn Risk Detected' : 'Usage Drop'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? '5 enterprise teams showing reduced activity. Engagement down 40%. Outreach campaign initiated. Monitor closely.'
                              : 'Daily active users dropped 8% from previous day. Investigation ongoing. Possible seasonal variation.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#f59e0b">3 days ago</Text>
                            <Text>•</Text>
                            <Text>5 teams</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#10b981" boxShadow="0 2px 8px 0 rgba(16, 185, 129, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#10b981" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">SUCCESS</Badge>
                            <Badge bg="#ffffff" color="#10b981" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Milestone</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? '10K Projects Milestone' : '100K Conversations'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Reached 10,000 active projects milestone. 23% month-over-month growth. Strong product-market fit indicators.'
                              : '100,000 total conversations milestone reached. Average conversation length: 8.5 messages. Strong engagement.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#10b981">3 days ago</Text>
                            <Text>•</Text>
                            <Text>Milestone</Text>
                          </HStack>
                        </Box>
                      </Grid>
                    </Box>
                    {/* 4-5 days ago */}
                    <Box display={morningBriefIndex === 4 ? 'block' : 'none'}>
                      <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
                        <Box bg="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#3b82f6" boxShadow="0 2px 8px 0 rgba(59, 130, 246, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#3b82f6" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">FEATURE</Badge>
                            <Badge bg="#ffffff" color="#3b82f6" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Beta</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Risk Dashboard Beta' : 'Collaborative Editing'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Risk dashboard entered beta testing. 12 teams participating. Initial feedback: 4.4/5 stars. Launch planned for next week.'
                              : 'Real-time collaborative editing feature in beta. 8 teams testing. Positive feedback on performance and UX.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#3b82f6">4-5 days ago</Text>
                            <Text>•</Text>
                            <Text>12 teams</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#9333ea" boxShadow="0 2px 8px 0 rgba(147, 51, 234, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#9333ea" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">TREND</Badge>
                            <Badge bg="#ffffff" color="#9333ea" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Growing</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Mobile App Usage' : 'Voice Feature Adoption'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Mobile app usage increased 34% over 4-5 days. 456 daily active mobile users. Consider mobile-first features.'
                              : 'Voice input feature adoption growing. 23% of new users trying voice. Strong signal for expansion.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#9333ea">4-5 days ago</Text>
                            <Text>•</Text>
                            <Text>+34%</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#ef4444" boxShadow="0 2px 8px 0 rgba(239, 68, 68, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#ef4444" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">ISSUE</Badge>
                            <Badge bg="#ffffff" color="#ef4444" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Resolved</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Sync Delays' : 'Response Timeout'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Data sync delays reported by 8 teams. Root cause: API rate limiting. Fixed with queue optimization. All systems stable.'
                              : 'Response timeout issues affecting 15 users. Fixed with connection pooling improvements. No further incidents.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#ef4444">4-5 days ago</Text>
                            <Text>•</Text>
                            <Text>Resolved</Text>
                          </HStack>
                        </Box>
                      </Grid>
                    </Box>
                    {/* 6-7 days ago */}
                    <Box display={morningBriefIndex === 5 ? 'block' : 'none'}>
                      <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
                        <Box bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#10b981" boxShadow="0 2px 8px 0 rgba(16, 185, 129, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#10b981" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">GROWTH</Badge>
                            <Badge bg="#ffffff" color="#10b981" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">+28%</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Weekly Signups' : 'New User Onboarding'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Weekly new signups increased 28% compared to previous week. 234 new teams. Strong marketing campaign impact.'
                              : 'New user onboarding up 28%. 1,456 new users. Improved onboarding flow showing positive results.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#10b981">6-7 days ago</Text>
                            <Text>•</Text>
                            <Text>+28%</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#3b82f6" boxShadow="0 2px 8px 0 rgba(59, 130, 246, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#3b82f6" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">FEATURE</Badge>
                            <Badge bg="#ffffff" color="#3b82f6" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Launched</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Integration Hub' : 'Prompt Analytics'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Integration hub launched with Jira, Slack, and Linear support. 45 teams connected in first week. User satisfaction: 4.7/5.'
                              : 'Prompt analytics dashboard launched. Track performance, usage, and optimization opportunities. 234 active users.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#3b82f6">6-7 days ago</Text>
                            <Text>•</Text>
                            <Text>45 teams</Text>
                          </HStack>
                        </Box>
                        <Box bg="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" borderRadius="6px" p={5} border="2px solid" borderColor="#f59e0b" boxShadow="0 2px 8px 0 rgba(245, 158, 11, 0.15)">
                          <HStack mb={3} spacing={2}>
                            <Badge bg="#f59e0b" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">ALERT</Badge>
                            <Badge bg="#ffffff" color="#f59e0b" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">Monitor</Badge>
                          </HStack>
                          <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                            {selectedProduct === 'pmai' ? 'Support Ticket Spike' : 'Error Rate Increase'}
                          </Text>
                          <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                            {selectedProduct === 'pmai'
                              ? 'Support tickets increased 45% week-over-week. Main issues: onboarding confusion and API documentation. Action items identified.'
                              : 'Error rate increased to 2.3% (target: <1%). Investigation ongoing. Possible correlation with new feature rollout.'}
                          </Text>
                          <HStack spacing={2} fontSize="xs" color="#6b7280">
                            <Text fontWeight="600" color="#f59e0b">6-7 days ago</Text>
                            <Text>•</Text>
                            <Text>+45%</Text>
                          </HStack>
                        </Box>
                      </Grid>
                    </Box>
                  </Box>
                </Box>

                {/* Shipped with Zeno AI */}
                <Box mb={10}>
                  <HStack mb={5} spacing={2} justify="space-between">
                    <HStack spacing={2}>
                      <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                        Shipped with Zeno AI
                      </Heading>
                      <Badge bg="#dcfce7" color="#16a34a" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                        AI-Generated Features
                      </Badge>
                    </HStack>
                  </HStack>
                  <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={5}>
                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2} justify="space-between">
                        <HStack spacing={2}>
                          <Badge bg="#dcfce7" color="#16a34a" px={2.5} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                            EXCEEDING
                          </Badge>
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">
                            Shipped 5 days ago
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'AI Sprint Planning Assistant' : 'Smart Prompt Suggestions'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? 'Generated by Zeno AI based on user feedback. Automatically creates sprint plans with risk assessment.'
                          : 'AI-powered prompt suggestions based on conversation context. Generated from community insights.'}
                      </Text>
                      <VStack align="stretch" spacing={3} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Adoption Rate</Text>
                          <HStack spacing={2}>
                            <Text fontWeight="700" color="#16a34a">84%</Text>
                            <ArrowUpIcon w={3} h={3} color="#16a34a" />
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Weekly Active Users</Text>
                          <Text fontWeight="700" color="#111827">
                            {selectedProduct === 'pmai' ? '3,124' : '2,456'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">User Satisfaction</Text>
                          <HStack spacing={1}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <StarIcon key={i} w={3} h={3} color={i <= 4 ? '#fbbf24' : '#e5e7eb'} />
                            ))}
                            <Text fontSize="xs" fontWeight="600" color="#111827" ml={1}>4.6/5</Text>
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Time Saved</Text>
                          <Text fontWeight="700" color="#16a34a">
                            {selectedProduct === 'pmai' ? '3.2k hrs/week' : '1.8k hrs/week'}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2} justify="space-between">
                        <HStack spacing={2}>
                          <Badge bg="#dbeafe" color="#2563eb" px={2.5} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                            ON TRACK
                          </Badge>
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">
                            Shipped 10 days ago
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Automated Risk Alerts' : 'Context-Aware Responses'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? 'AI-generated risk detection system. Monitors project health and sends proactive alerts.'
                          : 'Intelligent context management. AI maintains conversation flow across long sessions.'}
                      </Text>
                      <VStack align="stretch" spacing={3} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Adoption Rate</Text>
                          <HStack spacing={2}>
                            <Text fontWeight="700" color="#2563eb">67%</Text>
                            <ArrowUpIcon w={3} h={3} color="#2563eb" />
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Weekly Active Users</Text>
                          <Text fontWeight="700" color="#111827">
                            {selectedProduct === 'pmai' ? '2,189' : '1,743'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">User Satisfaction</Text>
                          <HStack spacing={1}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <StarIcon key={i} w={3} h={3} color={i <= 4 ? '#fbbf24' : '#e5e7eb'} />
                            ))}
                            <Text fontSize="xs" fontWeight="600" color="#111827" ml={1}>4.3/5</Text>
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Impact</Text>
                          <Text fontWeight="700" color="#2563eb">
                            {selectedProduct === 'pmai' ? '45% fewer delays' : '38% better retention'}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2} justify="space-between">
                        <HStack spacing={2}>
                          <Badge bg="#fef3c7" color="#d97706" px={2.5} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                            MONITORING
                          </Badge>
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">
                            Shipped 2 days ago
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Smart Dependency Mapping' : 'Prompt Performance Optimizer'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? 'AI-generated dependency visualization. Automatically maps project relationships and bottlenecks.'
                          : 'AI analyzes prompt effectiveness and suggests improvements. Generated from usage patterns.'}
                      </Text>
                      <VStack align="stretch" spacing={3} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Adoption Rate</Text>
                          <HStack spacing={2}>
                            <Text fontWeight="700" color="#d97706">32%</Text>
                            <Text fontSize="xs" color="#6b7280">Early days</Text>
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Weekly Active Users</Text>
                          <Text fontWeight="700" color="#111827">
                            {selectedProduct === 'pmai' ? '892' : '654'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">User Satisfaction</Text>
                          <HStack spacing={1}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <StarIcon key={i} w={3} h={3} color={i <= 3 ? '#fbbf24' : '#e5e7eb'} />
                            ))}
                            <Text fontSize="xs" fontWeight="600" color="#111827" ml={1}>3.9/5</Text>
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Impact</Text>
                          <Text fontWeight="700" color="#6b7280">TBD</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Grid>
                </Box>

                {/* Community Insights */}
                <Box mb={10}>
                  <HStack mb={5} spacing={2} justify="space-between">
                    <HStack spacing={2}>
                      <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                        Feature Recommendations
                      </Heading>
                      <Badge bg="#dcfce7" color="#16a34a" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                        AI-Generated
                      </Badge>
                    </HStack>
                  </HStack>
                  <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={5}>
                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2} justify="space-between">
                        <HStack spacing={2}>
                          <Badge bg="#dcfce7" color="#16a34a" px={2.5} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                            HIGH PRIORITY
                          </Badge>
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">
                            Confidence: 92%
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Jira Integration' : 'API Access for Prompts'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? '28 requests in last 3 days. High demand from enterprise customers. Estimated impact: $45k ARR. Recommended timeline: 2-3 weeks.'
                          : '45 API integration requests. Strong signal from developers. Estimated impact: 2.3k new users. Recommended timeline: 3-4 weeks.'}
                      </Text>
                      <VStack align="stretch" spacing={3} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Request Count</Text>
                          <Text fontWeight="700" color="#111827">
                            {selectedProduct === 'pmai' ? '28' : '45'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Estimated Impact</Text>
                          <Text fontWeight="700" color="#16a34a">
                            {selectedProduct === 'pmai' ? '$45k ARR' : '2.3k users'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Recommended Timeline</Text>
                          <Text fontWeight="700" color="#111827">
                            {selectedProduct === 'pmai' ? '2-3 weeks' : '3-4 weeks'}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2} justify="space-between">
                        <HStack spacing={2}>
                          <Badge bg="#dbeafe" color="#2563eb" px={2.5} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                            MEDIUM PRIORITY
                          </Badge>
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">
                            Confidence: 78%
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Mobile App Enhancements' : 'Voice Input Improvements'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? 'Mobile usage up 34%. Users requesting offline mode and push notifications. Estimated impact: 15% engagement increase.'
                          : 'Voice feature adoption growing. Users want better accuracy and multi-language support. Estimated impact: 18% user growth.'}
                      </Text>
                      <VStack align="stretch" spacing={3} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Signal Strength</Text>
                          <Text fontWeight="700" color="#2563eb">
                            {selectedProduct === 'pmai' ? '34% growth' : '23% adoption'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Estimated Impact</Text>
                          <Text fontWeight="700" color="#2563eb">
                            {selectedProduct === 'pmai' ? '15% engagement' : '18% growth'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Recommended Timeline</Text>
                          <Text fontWeight="700" color="#111827">
                            {selectedProduct === 'pmai' ? '4-6 weeks' : '5-7 weeks'}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2} justify="space-between">
                        <HStack spacing={2}>
                          <Badge bg="#fef3c7" color="#d97706" px={2.5} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                            EXPLORATORY
                          </Badge>
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">
                            Confidence: 65%
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'AI-Powered Analytics Dashboard' : 'Multi-Agent Workflow Builder'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? 'Emerging trend from power users. 12 mentions in community. Potential differentiator. Recommend user research first.'
                          : 'Growing interest from enterprise. 8 mentions. Could unlock new use cases. Recommend validation with beta users.'}
                      </Text>
                      <VStack align="stretch" spacing={3} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Signal Strength</Text>
                          <Text fontWeight="700" color="#d97706">
                            {selectedProduct === 'pmai' ? '12 mentions' : '8 mentions'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Next Step</Text>
                          <Text fontWeight="700" color="#d97706">
                            User Research
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280" fontWeight="500">Recommended Timeline</Text>
                          <Text fontWeight="700" color="#111827">
                            TBD
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Grid>
                </Box>

                {/* Community Insights */}
                <Box mb={6}>
                  <HStack mb={5} spacing={2} justify="space-between">
                    <HStack spacing={2}>
                      <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                        Community Insights
                      </Heading>
                      <Badge
                        bg="#f3f4f6"
                        color="#4b5563"
                        px={2}
                        py={0.5}
                        borderRadius="3px"
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {6 + customSources.length} sources
                      </Badge>
                    </HStack>
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={onOpen}
                      size="sm"
                      bg="#4b5563"
                      color="white"
                      fontWeight="600"
                      _hover={{ bg: '#374151' }}
                    >
                      Add Source
                    </Button>
                  </HStack>
                </Box>

                {/* Add Source Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="md">
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Add New Source</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel fontWeight="600" color="#374151" fontSize="sm">
                            Source Name
                          </FormLabel>
                          <Input
                            value={newSourceForm.name}
                            onChange={(e) => setNewSourceForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Dev.to, Stack Overflow"
                            bg="#ffffff"
                            borderColor="#d1d5db"
                            borderWidth="1px"
                            size="md"
                            _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                            _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontWeight="600" color="#374151" fontSize="sm">
                            Website URL
                          </FormLabel>
                          <Input
                            value={newSourceForm.url}
                            onChange={(e) => setNewSourceForm(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://example.com"
                            bg="#ffffff"
                            borderColor="#d1d5db"
                            borderWidth="1px"
                            size="md"
                            _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                            _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontWeight="600" color="#374151" fontSize="sm">
                            Accent Color
                          </FormLabel>
                          <HStack spacing={3}>
                            <Input
                              type="color"
                              value={newSourceForm.color}
                              onChange={(e) => setNewSourceForm(prev => ({ ...prev, color: e.target.value }))}
                              w="60px"
                              h="40px"
                              p={1}
                              border="1px solid"
                              borderColor="#d1d5db"
                              borderRadius="4px"
                              cursor="pointer"
                            />
                            <Input
                              value={newSourceForm.color}
                              onChange={(e) => setNewSourceForm(prev => ({ ...prev, color: e.target.value }))}
                              placeholder="#6b7280"
                              bg="#ffffff"
                              borderColor="#d1d5db"
                              borderWidth="1px"
                              size="md"
                              fontFamily="monospace"
                              _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                              _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                            />
                          </HStack>
                        </FormControl>
                      </VStack>
                    </ModalBody>
                    <ModalFooter>
                      <ButtonGroup spacing={3}>
                        <Button
                          variant="ghost"
                          onClick={onClose}
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddSource}
                          bg="#4b5563"
                          color="white"
                          fontWeight="600"
                          _hover={{ bg: '#374151' }}
                        >
                          Add Source
                        </Button>
                      </ButtonGroup>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
                <Grid templateColumns="repeat(auto-fit, minmax(380px, 1fr))" gap={5}>
                  {/* Reddit Post */}
                  <Box
                    bg="#ffffff"
                    borderRadius="6px"
                    p={6}
                    border="1px solid"
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s', borderColor: '#d1d5db' }}
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      w="4px"
                      h="100%"
                      bg="#ff4500"
                    />
                    <HStack mb={4} spacing={2} justify="space-between">
                      <HStack spacing={2}>
                        <Badge
                          bg="#ff4500"
                          color="white"
                          px={2.5}
                          py={1}
                          borderRadius="4px"
                          fontSize="xs"
                          fontWeight="700"
                          letterSpacing="0.3px"
                        >
                          r/programming
                        </Badge>
                        <Text fontSize="xs" color="#9ca3af" fontWeight="500">reddit.com</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          onClick={() => navigatePost('reddit', 'prev')}
                          size="xs"
                          variant="ghost"
                          aria-label="Previous post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                        <Text fontSize="xs" color="#6b7280" fontWeight="500" minW="30px" textAlign="center">
                          {postIndices.reddit + 1}/{getPosts().reddit.length}
                        </Text>
                        <IconButton
                          icon={<ChevronRightIcon />}
                          onClick={() => navigatePost('reddit', 'next')}
                          size="xs"
                          variant="ghost"
                          aria-label="Next post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                      </HStack>
                    </HStack>
                    <Text color="#111827" fontSize="md" fontWeight="700" mb={3} lineHeight="1.5">
                      {getPosts().reddit[postIndices.reddit].title}
                    </Text>
                    <Text color="#4b5563" fontSize="sm" lineHeight="1.7" mb={4}>
                      {getPosts().reddit[postIndices.reddit].content}
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="#6b7280" pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                      <HStack spacing={1}>
                        <ArrowUpIcon w={3} h={3} color="#ff4500" />
                        <Text fontWeight="700" color="#111827">{getPosts().reddit[postIndices.reddit].upvotes}</Text>
                        <Text>upvotes</Text>
                      </HStack>
                      <Text>•</Text>
                      <Text fontWeight="500">{getPosts().reddit[postIndices.reddit].author}</Text>
                      <Text>•</Text>
                      <Text>{getPosts().reddit[postIndices.reddit].time}</Text>
                    </HStack>
                  </Box>

                  {/* Twitter/X Post */}
                  <Box
                    bg="#ffffff"
                    borderRadius="6px"
                    p={6}
                    border="1px solid"
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s', borderColor: '#d1d5db' }}
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      w="4px"
                      h="100%"
                      bg="#1da1f2"
                    />
                    <HStack mb={4} spacing={2} justify="space-between">
                      <HStack spacing={2}>
                        <Badge
                          bg="#1da1f2"
                          color="white"
                          px={2.5}
                          py={1}
                          borderRadius="4px"
                          fontSize="xs"
                          fontWeight="700"
                          letterSpacing="0.3px"
                        >
                          Twitter
                        </Badge>
                        <Text fontSize="xs" color="#9ca3af" fontWeight="500">twitter.com</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          onClick={() => navigatePost('twitter', 'prev')}
                          size="xs"
                          variant="ghost"
                          aria-label="Previous post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                        <Text fontSize="xs" color="#6b7280" fontWeight="500" minW="30px" textAlign="center">
                          {postIndices.twitter + 1}/{getPosts().twitter.length}
                        </Text>
                        <IconButton
                          icon={<ChevronRightIcon />}
                          onClick={() => navigatePost('twitter', 'next')}
                          size="xs"
                          variant="ghost"
                          aria-label="Next post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                      </HStack>
                    </HStack>
                    <HStack mb={4} spacing={3}>
                      <Box
                        w={10}
                        h={10}
                        bg="linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%)"
                        borderRadius="50%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="xs" fontWeight="700" color="white">TS</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" fontWeight="700" color="#111827">TechStack Daily</Text>
                        <Text fontSize="xs" color="#6b7280" fontWeight="500">@techstackdaily</Text>
                      </Box>
                    </HStack>
                    <Text color="#111827" fontSize="sm" lineHeight="1.7" mb={4}>
                      {getPosts().twitter[postIndices.twitter].content}
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="#6b7280" pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                      <HStack spacing={1}>
                        <Text fontWeight="700" color="#111827">{getPosts().twitter[postIndices.twitter].retweets}</Text>
                        <Text>retweets</Text>
                      </HStack>
                      <Text>•</Text>
                      <HStack spacing={1}>
                        <Text fontWeight="700" color="#111827">{getPosts().twitter[postIndices.twitter].likes}</Text>
                        <Text>likes</Text>
                      </HStack>
                      <Text>•</Text>
                      <Text>{getPosts().twitter[postIndices.twitter].time}</Text>
                    </HStack>
                  </Box>

                  {/* HackerNews Post */}
                  <Box
                    bg="#ffffff"
                    borderRadius="6px"
                    p={6}
                    border="1px solid"
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s', borderColor: '#d1d5db' }}
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      w="4px"
                      h="100%"
                      bg="#ff6600"
                    />
                    <HStack mb={4} spacing={2} justify="space-between">
                      <HStack spacing={2}>
                        <Badge
                          bg="#ff6600"
                          color="white"
                          px={2.5}
                          py={1}
                          borderRadius="4px"
                          fontSize="xs"
                          fontWeight="700"
                          letterSpacing="0.3px"
                        >
                          Hacker News
                        </Badge>
                        <Text fontSize="xs" color="#9ca3af" fontWeight="500">news.ycombinator.com</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          onClick={() => navigatePost('hackernews', 'prev')}
                          size="xs"
                          variant="ghost"
                          aria-label="Previous post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                        <Text fontSize="xs" color="#6b7280" fontWeight="500" minW="30px" textAlign="center">
                          {postIndices.hackernews + 1}/{getPosts().hackernews.length}
                        </Text>
                        <IconButton
                          icon={<ChevronRightIcon />}
                          onClick={() => navigatePost('hackernews', 'next')}
                          size="xs"
                          variant="ghost"
                          aria-label="Next post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                      </HStack>
                    </HStack>
                    <Text color="#111827" fontSize="md" fontWeight="700" mb={3} lineHeight="1.5">
                      {getPosts().hackernews[postIndices.hackernews].title}
                    </Text>
                    <Text color="#4b5563" fontSize="sm" lineHeight="1.7" mb={4}>
                      {getPosts().hackernews[postIndices.hackernews].content}
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="#6b7280" pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                      <HStack spacing={1}>
                        <ArrowUpIcon w={3} h={3} color="#ff6600" />
                        <Text fontWeight="700" color="#111827">{getPosts().hackernews[postIndices.hackernews].points}</Text>
                        <Text>points</Text>
                      </HStack>
                      <Text>•</Text>
                      <Text fontWeight="500">{getPosts().hackernews[postIndices.hackernews].comments} comments</Text>
                      <Text>•</Text>
                      <Text fontWeight="500">by {getPosts().hackernews[postIndices.hackernews].author}</Text>
                      <Text>•</Text>
                      <Text>{getPosts().hackernews[postIndices.hackernews].time}</Text>
                    </HStack>
                  </Box>

                  {/* TechCrunch Article */}
                  <Box
                    bg="#ffffff"
                    borderRadius="6px"
                    p={6}
                    border="1px solid"
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s', borderColor: '#d1d5db' }}
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      w="4px"
                      h="100%"
                      bg="#00a562"
                    />
                    <HStack mb={4} spacing={2} justify="space-between">
                      <HStack spacing={2}>
                        <Badge
                          bg="#00a562"
                          color="white"
                          px={2.5}
                          py={1}
                          borderRadius="4px"
                          fontSize="xs"
                          fontWeight="700"
                          letterSpacing="0.3px"
                        >
                          TechCrunch
                        </Badge>
                        <Text fontSize="xs" color="#9ca3af" fontWeight="500">techcrunch.com</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          onClick={() => navigatePost('techcrunch', 'prev')}
                          size="xs"
                          variant="ghost"
                          aria-label="Previous post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                        <Text fontSize="xs" color="#6b7280" fontWeight="500" minW="30px" textAlign="center">
                          {postIndices.techcrunch + 1}/{getPosts().techcrunch.length}
                        </Text>
                        <IconButton
                          icon={<ChevronRightIcon />}
                          onClick={() => navigatePost('techcrunch', 'next')}
                          size="xs"
                          variant="ghost"
                          aria-label="Next post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                      </HStack>
                    </HStack>
                    <Text color="#111827" fontSize="md" fontWeight="700" mb={3} lineHeight="1.5">
                      {getPosts().techcrunch[postIndices.techcrunch].title}
                    </Text>
                    <Text color="#4b5563" fontSize="sm" lineHeight="1.7" mb={4}>
                      {getPosts().techcrunch[postIndices.techcrunch].content}
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="#6b7280" pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                      <Text fontWeight="600" color="#111827">{getPosts().techcrunch[postIndices.techcrunch].author}</Text>
                      <Text>•</Text>
                      <Text>{getPosts().techcrunch[postIndices.techcrunch].time}</Text>
                      <Text>•</Text>
                      <HStack spacing={1} _hover={{ color: '#2563eb' }} cursor="pointer">
                        <ExternalLinkIcon w={3} h={3} />
                        <Text fontWeight="500">Read article</Text>
                      </HStack>
                    </HStack>
                  </Box>

                  {/* Medium Article */}
                  <Box
                    bg="#ffffff"
                    borderRadius="6px"
                    p={6}
                    border="1px solid"
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s', borderColor: '#d1d5db' }}
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      w="4px"
                      h="100%"
                      bg="#000000"
                    />
                    <HStack mb={4} spacing={2} justify="space-between">
                      <HStack spacing={2}>
                        <Badge
                          bg="#000000"
                          color="white"
                          px={2.5}
                          py={1}
                          borderRadius="4px"
                          fontSize="xs"
                          fontWeight="700"
                          letterSpacing="0.3px"
                        >
                          Medium
                        </Badge>
                        <Text fontSize="xs" color="#9ca3af" fontWeight="500">medium.com</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          onClick={() => navigatePost('medium', 'prev')}
                          size="xs"
                          variant="ghost"
                          aria-label="Previous post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                        <Text fontSize="xs" color="#6b7280" fontWeight="500" minW="30px" textAlign="center">
                          {postIndices.medium + 1}/{getPosts().medium.length}
                        </Text>
                        <IconButton
                          icon={<ChevronRightIcon />}
                          onClick={() => navigatePost('medium', 'next')}
                          size="xs"
                          variant="ghost"
                          aria-label="Next post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                      </HStack>
                    </HStack>
                    <Text color="#111827" fontSize="md" fontWeight="700" mb={3} lineHeight="1.5">
                      {getPosts().medium[postIndices.medium].title}
                    </Text>
                    <Text color="#4b5563" fontSize="sm" lineHeight="1.7" mb={4}>
                      {getPosts().medium[postIndices.medium].content}
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="#6b7280" pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                      <Text fontWeight="600" color="#111827">{getPosts().medium[postIndices.medium].author}</Text>
                      <Text>•</Text>
                      <Text>{getPosts().medium[postIndices.medium].readTime}</Text>
                      <Text>•</Text>
                      <HStack spacing={1}>
                        <Text fontWeight="700" color="#111827">{getPosts().medium[postIndices.medium].claps}</Text>
                        <Text>claps</Text>
                      </HStack>
                      <Text>•</Text>
                      <Text>{getPosts().medium[postIndices.medium].time}</Text>
                    </HStack>
                  </Box>

                  {/* Product Hunt Post */}
                  <Box
                    bg="#ffffff"
                    borderRadius="6px"
                    p={6}
                    border="1px solid"
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s', borderColor: '#d1d5db' }}
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      w="4px"
                      h="100%"
                      bg="#da552f"
                    />
                    <HStack mb={4} spacing={2} justify="space-between">
                      <HStack spacing={2}>
                        <Badge
                          bg="#da552f"
                          color="white"
                          px={2.5}
                          py={1}
                          borderRadius="4px"
                          fontSize="xs"
                          fontWeight="700"
                          letterSpacing="0.3px"
                        >
                          Product Hunt
                        </Badge>
                        <Text fontSize="xs" color="#9ca3af" fontWeight="500">producthunt.com</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          onClick={() => navigatePost('producthunt', 'prev')}
                          size="xs"
                          variant="ghost"
                          aria-label="Previous post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                        <Text fontSize="xs" color="#6b7280" fontWeight="500" minW="30px" textAlign="center">
                          {postIndices.producthunt + 1}/{getPosts().producthunt.length}
                        </Text>
                        <IconButton
                          icon={<ChevronRightIcon />}
                          onClick={() => navigatePost('producthunt', 'next')}
                          size="xs"
                          variant="ghost"
                          aria-label="Next post"
                          color="#6b7280"
                          _hover={{ bg: '#f3f4f6', color: '#111827' }}
                        />
                      </HStack>
                    </HStack>
                    <Text color="#111827" fontSize="md" fontWeight="700" mb={3} lineHeight="1.5">
                      {getPosts().producthunt[postIndices.producthunt].title}
                    </Text>
                    <Text color="#4b5563" fontSize="sm" lineHeight="1.7" mb={4}>
                      {getPosts().producthunt[postIndices.producthunt].content}
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="#6b7280" pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                      <HStack spacing={1}>
                        <ArrowUpIcon w={3} h={3} color="#da552f" />
                        <Text fontWeight="700" color="#111827">{getPosts().producthunt[postIndices.producthunt].upvotes}</Text>
                        <Text>upvotes</Text>
                      </HStack>
                      <Text>•</Text>
                      <Text fontWeight="500">Made by {getPosts().producthunt[postIndices.producthunt].maker}</Text>
                      <Text>•</Text>
                      <Badge
                        bg="#fef3c7"
                        color="#d97706"
                        px={2}
                        py={0.5}
                        borderRadius="3px"
                        fontSize="xs"
                        fontWeight="700"
                      >
                        {getPosts().producthunt[postIndices.producthunt].badge}
                      </Badge>
                    </HStack>
                  </Box>

                  {/* Custom Sources */}
                  {customSources.map((source) => {
                    const currentPost = source.posts[postIndices[source.id] || 0];
                    return (
                      <Box
                        key={source.id}
                        bg="#ffffff"
                        borderRadius="6px"
                        p={6}
                        border="1px solid"
                        borderColor="#e5e7eb"
                        boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                        _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s', borderColor: '#d1d5db' }}
                        position="relative"
                        overflow="hidden"
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          w="4px"
                          h="100%"
                          bg={source.color}
                        />
                        <HStack mb={4} spacing={2} justify="space-between">
                          <HStack spacing={2}>
                            <Badge
                              bg={source.color}
                              color="white"
                              px={2.5}
                              py={1}
                              borderRadius="4px"
                              fontSize="xs"
                              fontWeight="700"
                              letterSpacing="0.3px"
                            >
                              {source.name}
                            </Badge>
                            <Text fontSize="xs" color="#9ca3af" fontWeight="500">{source.url}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <IconButton
                              icon={<ChevronLeftIcon />}
                              onClick={() => navigateCustomPost(source.id, 'prev')}
                              size="xs"
                              variant="ghost"
                              aria-label="Previous post"
                              color="#6b7280"
                              _hover={{ bg: '#f3f4f6', color: '#111827' }}
                            />
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" minW="30px" textAlign="center">
                              {(postIndices[source.id] || 0) + 1}/{source.posts.length}
                            </Text>
                            <IconButton
                              icon={<ChevronRightIcon />}
                              onClick={() => navigateCustomPost(source.id, 'next')}
                              size="xs"
                              variant="ghost"
                              aria-label="Next post"
                              color="#6b7280"
                              _hover={{ bg: '#f3f4f6', color: '#111827' }}
                            />
                          </HStack>
                        </HStack>
                        <Text color="#111827" fontSize="md" fontWeight="700" mb={3} lineHeight="1.5">
                          {currentPost.title}
                        </Text>
                        <Text color="#4b5563" fontSize="sm" lineHeight="1.7" mb={4}>
                          {currentPost.content}
                        </Text>
                        <HStack spacing={4} fontSize="xs" color="#6b7280" pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                          <HStack spacing={1}>
                            <ArrowUpIcon w={3} h={3} color={source.color} />
                            <Text fontWeight="700" color="#111827">{currentPost.upvotes}</Text>
                            <Text>upvotes</Text>
                          </HStack>
                          <Text>•</Text>
                          <Text fontWeight="500">{currentPost.author}</Text>
                          <Text>•</Text>
                          <Text>{currentPost.time}</Text>
                        </HStack>
                      </Box>
                    );
                  })}
                </Grid>
                </Container>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>


        {/* AI Assistant Toggle Button - Fixed position, only in Sandbox tab */}
        {activeTab === 1 && (
          <Box
            position="fixed"
            bottom="24px"
            right="24px"
            zIndex={9999}
            pointerEvents="auto"
          >
            <IconButton
              icon={<ChatIcon />}
              onClick={handleToggleChat}
              size="lg"
              aria-label="Open AI Assistant"
              bg={chatOpen ? 'gray.700' : 'gray.600'}
              color="white"
              borderRadius="50%"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
              _hover={{ bg: 'gray.700', transform: 'scale(1.05)' }}
              _active={{ transform: 'scale(0.95)' }}
              transition="all 0.2s"
              w="56px"
              h="56px"
              pointerEvents="auto"
            />
          </Box>
        )}
      </Box>
    </ChakraProvider>
  );
}

export default App;
