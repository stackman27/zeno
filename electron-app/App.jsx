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
  Center
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
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubConnecting, setGithubConnecting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [availableRepos, setAvailableRepos] = useState([]);
  const [aiAgentMessages, setAiAgentMessages] = useState([]);
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

  useEffect(() => {
    // Set up output listener
    window.electronAPI?.onZenoOutput((data) => {
      const text = data.data;
      setOutput(prev => prev + text);
      parseUrlsFromOutput(text);
    });

    return () => {
      window.electronAPI?.removeZenoOutputListener();
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
    setChatOpen(!chatOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRunning) return;

    setOutput('');
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

  useEffect(() => {
    // Auto-select UI when detected
    if (detectedUrls.ui && !selectedUrl) {
      setSelectedUrl(detectedUrls.ui);
    }
  }, [detectedUrls.ui, selectedUrl]);

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="#f9fafb" color="gray.800" position="relative" overflow="hidden">
        {/* Header - Dark header */}
        <Box
          bg="#1f2937"
          borderBottom="1px solid"
          borderColor="#374151"
          py={4}
          px={8}
        >
          <Container maxW="container.xl">
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={3}>
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
              <Text color="#9ca3af" fontSize="sm" fontWeight="500">
                Docker Runner
              </Text>
            </Flex>
          </Container>
        </Box>

        {/* Tabs - Dark tabs bar */}
        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="gray" isLazy>
          <Box bg="#374151" borderBottom="1px solid" borderColor="#4b5563">
            <Container maxW="container.xl" px={8}>
              <TabList borderBottom="none" gap={1}>
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
                  Control Panel
                </Tab>
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
                  Browser
                </Tab>
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
                  Product Insights
                </Tab>
              </TabList>
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
                                  ]);
                                setAiAgentMessages(prev => [...prev, {
                                  role: 'agent',
                                  content: 'Successfully connected to GitHub! Found 5 repositories.',
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
                    bg="#1a1d23"
                    borderRadius="3px"
                    p={5}
                    overflowY="auto"
                    fontFamily="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
                    fontSize="13px"
                    border="1px solid"
                    borderColor="#2a2d33"
                    lineHeight="1.6"
                    fontWeight="400"
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#e5e7eb' }}>
                      {output || <Text color="#9ca3af">No output yet. Run a workflow to see logs here.</Text>}
                    </pre>
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
                  </HStack>
                </Box>

                {/* Full Screen Browser View */}
                <Box flex={1} bg="white" position="relative" minH={0}>
                  {selectedUrl ? (
                    <webview
                      ref={browserViewRef}
                      src={selectedUrl}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      bg="#f3f4f6"
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
                        Today
                      </Badge>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge bg="#dcfce7" color="#16a34a" px={2.5} py={1} borderRadius="4px" fontSize="xs" fontWeight="600">
                        Review Streak: 7 days
                      </Badge>
                    </HStack>
                  </HStack>
                  <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
                    {/* Opportunity Card */}
                    <Box
                      bg="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
                      borderRadius="6px"
                      p={5}
                      border="2px solid"
                      borderColor="#3b82f6"
                      boxShadow="0 2px 8px 0 rgba(59, 130, 246, 0.15)"
                      position="relative"
                      overflow="hidden"
                    >
                      <HStack mb={3} spacing={2}>
                        <Badge bg="#3b82f6" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">
                          OPPORTUNITY
                        </Badge>
                        <Badge bg="#ffffff" color="#3b82f6" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                          Build
                        </Badge>
                      </HStack>
                      <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Automated Sprint Planning' : 'Voice-to-Text Prompt Input'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                        {selectedProduct === 'pmai' 
                          ? '23 PMs mentioned needing automated sprint planning. High confidence (85%) based on 5+ sources.'
                          : '12 users requested voice input for prompts. Strong signal from power users.'}
                      </Text>
                      <HStack spacing={2} fontSize="xs" color="#6b7280">
                        <Text fontWeight="600" color="#3b82f6">Confidence: 85%</Text>
                        <Text>•</Text>
                        <Text>5 sources</Text>
                      </HStack>
                    </Box>

                    {/* Competitor Move Card */}
                    <Box
                      bg="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                      borderRadius="6px"
                      p={5}
                      border="2px solid"
                      borderColor="#f59e0b"
                      boxShadow="0 2px 8px 0 rgba(245, 158, 11, 0.15)"
                      position="relative"
                      overflow="hidden"
                    >
                      <HStack mb={3} spacing={2}>
                        <Badge bg="#f59e0b" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">
                          COMPETITOR
                        </Badge>
                        <Badge bg="#ffffff" color="#f59e0b" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                          Launched
                        </Badge>
                      </HStack>
                      <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Asana: AI-Powered Planning' : 'ChatGPT: Custom Prompt Library'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                        {selectedProduct === 'pmai'
                          ? 'Asana launched AI-powered sprint planning. Price: $15/user/month.'
                          : 'ChatGPT added shared prompt library. Users migrating for collaboration features.'}
                      </Text>
                      <HStack spacing={2} fontSize="xs" color="#6b7280">
                        <Text fontWeight="600" color="#f59e0b">2 hours ago</Text>
                        <Text>•</Text>
                        <Text>High impact</Text>
                      </HStack>
                    </Box>

                    {/* Pain Spike Card */}
                    <Box
                      bg="linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
                      borderRadius="6px"
                      p={5}
                      border="2px solid"
                      borderColor="#ef4444"
                      boxShadow="0 2px 8px 0 rgba(239, 68, 68, 0.15)"
                      position="relative"
                      overflow="hidden"
                    >
                      <HStack mb={3} spacing={2}>
                        <Badge bg="#ef4444" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">
                          PAIN SPIKE
                        </Badge>
                        <Badge bg="#ffffff" color="#ef4444" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                          Critical
                        </Badge>
                      </HStack>
                      <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Sprint Planning Delays' : 'Context Loss in Long Conversations'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                        {selectedProduct === 'pmai'
                          ? '18 reports of planning delays in last 24h. Affecting sprint velocity.'
                          : '15 users reported losing context after 20+ messages. Severity: High.'}
                      </Text>
                      <HStack spacing={2} fontSize="xs" color="#6b7280">
                        <Text fontWeight="600" color="#ef4444">+240% vs yesterday</Text>
                        <Text>•</Text>
                        <Text>Onboarding</Text>
                      </HStack>
                    </Box>

                    {/* Roadmap Risk Card */}
                    <Box
                      bg="linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%)"
                      borderRadius="6px"
                      p={5}
                      border="2px solid"
                      borderColor="#9333ea"
                      boxShadow="0 2px 8px 0 rgba(147, 51, 234, 0.15)"
                      position="relative"
                      overflow="hidden"
                    >
                      <HStack mb={3} spacing={2}>
                        <Badge bg="#9333ea" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">
                          ROADMAP
                        </Badge>
                        <Badge bg="#ffffff" color="#9333ea" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                          Risk
                        </Badge>
                      </HStack>
                      <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Q2 Feature Timeline' : 'Prompt Template Launch'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                        {selectedProduct === 'pmai'
                          ? 'Competitor feature overlap detected. Consider accelerating Jira integration.'
                          : 'User demand for templates up 60%. Consider moving launch date forward.'}
                      </Text>
                      <HStack spacing={2} fontSize="xs" color="#6b7280">
                        <Text fontWeight="600" color="#9333ea">Timeline impact</Text>
                        <Text>•</Text>
                        <Text>Q2 2024</Text>
                      </HStack>
                    </Box>

                    {/* Metric Moved Card */}
                    <Box
                      bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                      borderRadius="6px"
                      p={5}
                      border="2px solid"
                      borderColor="#10b981"
                      boxShadow="0 2px 8px 0 rgba(16, 185, 129, 0.15)"
                      position="relative"
                      overflow="hidden"
                    >
                      <HStack mb={3} spacing={2}>
                        <Badge bg="#10b981" color="white" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="700">
                          METRIC
                        </Badge>
                        <Badge bg="#ffffff" color="#10b981" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                          +24%
                        </Badge>
                      </HStack>
                      <Text fontSize="md" fontWeight="700" color="#111827" mb={2}>
                        {selectedProduct === 'pmai' ? 'Daily Active Projects' : 'Daily Active Conversations'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={3} lineHeight="1.6">
                        {selectedProduct === 'pmai'
                          ? 'DAU increased 24% week-over-week. Driven by new team integrations.'
                          : 'Daily conversations up 24%. Prompt templates feature driving engagement.'}
                      </Text>
                      <HStack spacing={2} fontSize="xs" color="#6b7280">
                        <Text fontWeight="600" color="#10b981">Week-over-week</Text>
                        <Text>•</Text>
                        <Text>12,456 → 15,432</Text>
                      </HStack>
                    </Box>
                  </Grid>
                </Box>

                {/* Recent Feature Launched Traction */}
                {selectedProduct === 'pmai' ? (
                  <Box mb={10}>
                    <HStack mb={5} spacing={2}>
                      <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                        Feature Performance
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
                        3 active
                      </Badge>
                    </HStack>
                    <Grid templateColumns="repeat(auto-fit, minmax(320px, 1fr))" gap={5}>
                      <Box
                        bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                        borderRadius="6px"
                        p={6}
                        border="1px solid"
                        borderColor="#e5e7eb"
                        boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                        position="relative"
                        overflow="hidden"
                        _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          right={0}
                          w="120px"
                          h="120px"
                          bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                          opacity="0.05"
                          borderRadius="0 0 0 100%"
                        />
                        <HStack mb={4} justify="space-between" align="flex-start">
                          <Box flex={1}>
                            <HStack mb={2} spacing={2}>
                              <Box
                                w={8}
                                h={8}
                                bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                borderRadius="5px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <CheckIcon w={4} h={4} color="white" />
                              </Box>
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Automated Sprint Planning
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" ml={10}>
                              Launched 2 weeks ago
                            </Text>
                          </Box>
                        </HStack>
                        <VStack align="stretch" spacing={4} mt={5}>
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                                Adoption Rate
                              </Text>
                              <HStack spacing={1}>
                                <ArrowUpIcon w={3} h={3} color="#10b981" />
                                <Text fontSize="xs" fontWeight="600" color="#10b981">+18%</Text>
                              </HStack>
                            </HStack>
                            <HStack spacing={2} align="center">
                              <Text fontSize="2xl" fontWeight="700" color="#111827">72%</Text>
                              <Box flex={1} h={2} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                <Box w="72%" h="100%" bg="linear-gradient(90deg, #10b981 0%, #059669 100%)" borderRadius="full" />
                              </Box>
                            </HStack>
                          </Box>
                          <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="#e5e7eb">
                            <Box>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Active Projects</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">8,234</Text>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Satisfaction</Text>
                              <HStack spacing={1} justify="flex-end">
                                <StarIcon w={3} h={3} color="#fbbf24" />
                                <Text fontSize="lg" fontWeight="700" color="#111827">4.8</Text>
                              </HStack>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Time Saved</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">2.4k hrs</Text>
                            </Box>
                          </HStack>
                        </VStack>
                      </Box>

                      <Box
                        bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                        borderRadius="6px"
                        p={6}
                        border="1px solid"
                        borderColor="#e5e7eb"
                        boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                        position="relative"
                        overflow="hidden"
                        _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          right={0}
                          w="120px"
                          h="120px"
                          bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                          opacity="0.05"
                          borderRadius="0 0 0 100%"
                        />
                        <HStack mb={4} justify="space-between" align="flex-start">
                          <Box flex={1}>
                            <HStack mb={2} spacing={2}>
                              <Box
                                w={8}
                                h={8}
                                bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                                borderRadius="5px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <CheckIcon w={4} h={4} color="white" />
                              </Box>
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Risk Detection AI
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" ml={10}>
                              Launched 1 month ago
                            </Text>
                          </Box>
                        </HStack>
                        <VStack align="stretch" spacing={4} mt={5}>
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                                Adoption Rate
                              </Text>
                              <HStack spacing={1}>
                                <ArrowUpIcon w={3} h={3} color="#10b981" />
                                <Text fontSize="xs" fontWeight="600" color="#10b981">+15%</Text>
                              </HStack>
                            </HStack>
                            <HStack spacing={2} align="center">
                              <Text fontSize="2xl" fontWeight="700" color="#111827">85%</Text>
                              <Box flex={1} h={2} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                <Box w="85%" h="100%" bg="linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)" borderRadius="full" />
                              </Box>
                            </HStack>
                          </Box>
                          <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="#e5e7eb">
                            <Box>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Active Projects</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">12,456</Text>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Satisfaction</Text>
                              <HStack spacing={1} justify="flex-end">
                                <StarIcon w={3} h={3} color="#fbbf24" />
                                <Text fontSize="lg" fontWeight="700" color="#111827">4.9</Text>
                              </HStack>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Risks Detected</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">5.8k</Text>
                            </Box>
                          </HStack>
                        </VStack>
                      </Box>

                      <Box
                        bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                        borderRadius="6px"
                        p={6}
                        border="1px solid"
                        borderColor="#e5e7eb"
                        boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                        position="relative"
                        overflow="hidden"
                        _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          right={0}
                          w="120px"
                          h="120px"
                          bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                          opacity="0.05"
                          borderRadius="0 0 0 100%"
                        />
                        <HStack mb={4} justify="space-between" align="flex-start">
                          <Box flex={1}>
                            <HStack mb={2} spacing={2}>
                              <Box
                                w={8}
                                h={8}
                                bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                borderRadius="5px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <CheckIcon w={4} h={4} color="white" />
                              </Box>
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Bridge Aggregator
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" ml={10}>
                              Launched 3 weeks ago
                            </Text>
                          </Box>
                        </HStack>
                        <VStack align="stretch" spacing={4} mt={5}>
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                                Adoption Rate
                              </Text>
                              <HStack spacing={1}>
                                <ArrowUpIcon w={3} h={3} color="#10b981" />
                                <Text fontSize="xs" fontWeight="600" color="#10b981">+22%</Text>
                              </HStack>
                            </HStack>
                            <HStack spacing={2} align="center">
                              <Text fontSize="2xl" fontWeight="700" color="#111827">61%</Text>
                              <Box flex={1} h={2} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                <Box w="61%" h="100%" bg="linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" borderRadius="full" />
                              </Box>
                            </HStack>
                          </Box>
                          <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="#e5e7eb">
                            <Box>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Daily Transfers</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">5,892</Text>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Satisfaction</Text>
                              <HStack spacing={1} justify="flex-end">
                                <StarIcon w={3} h={3} color="#fbbf24" />
                                <Text fontSize="lg" fontWeight="700" color="#111827">4.6</Text>
                              </HStack>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>TVL</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">$1.9M</Text>
                            </Box>
                          </HStack>
                        </VStack>
                      </Box>
                    </Grid>
                  </Box>
                ) : (
                  <Box mb={10}>
                    <HStack mb={5} spacing={2}>
                      <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                        Feature Performance
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
                        3 active
                      </Badge>
                    </HStack>
                    <Grid templateColumns="repeat(auto-fit, minmax(320px, 1fr))" gap={5}>
                      <Box
                        bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                        borderRadius="6px"
                        p={6}
                        border="1px solid"
                        borderColor="#e5e7eb"
                        boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                        position="relative"
                        overflow="hidden"
                        _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          right={0}
                          w="120px"
                          h="120px"
                          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          opacity="0.05"
                          borderRadius="0 0 0 100%"
                        />
                        <HStack mb={4} justify="space-between" align="flex-start">
                          <Box flex={1}>
                            <HStack mb={2} spacing={2}>
                              <Box
                                w={8}
                                h={8}
                                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                borderRadius="5px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <CheckIcon w={4} h={4} color="white" />
                              </Box>
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Advanced Prompt Templates
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" ml={10}>
                              Launched 2 weeks ago
                            </Text>
                          </Box>
                        </HStack>
                        <VStack align="stretch" spacing={4} mt={5}>
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                                Adoption Rate
                              </Text>
                              <HStack spacing={1}>
                                <ArrowUpIcon w={3} h={3} color="#10b981" />
                                <Text fontSize="xs" fontWeight="600" color="#10b981">+24%</Text>
                              </HStack>
                            </HStack>
                            <HStack spacing={2} align="center">
                              <Text fontSize="2xl" fontWeight="700" color="#111827">78%</Text>
                              <Box flex={1} h={2} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                <Box w="78%" h="100%" bg="linear-gradient(90deg, #667eea 0%, #764ba2 100%)" borderRadius="full" />
                              </Box>
                            </HStack>
                          </Box>
                          <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="#e5e7eb">
                            <Box>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Daily Messages</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">12,456</Text>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Satisfaction</Text>
                              <HStack spacing={1} justify="flex-end">
                                <StarIcon w={3} h={3} color="#fbbf24" />
                                <Text fontSize="lg" fontWeight="700" color="#111827">4.9</Text>
                              </HStack>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Active Users</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">3.2k</Text>
                            </Box>
                          </HStack>
                        </VStack>
                      </Box>

                      <Box
                        bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                        borderRadius="6px"
                        p={6}
                        border="1px solid"
                        borderColor="#e5e7eb"
                        boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                        position="relative"
                        overflow="hidden"
                        _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          right={0}
                          w="120px"
                          h="120px"
                          bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                          opacity="0.05"
                          borderRadius="0 0 0 100%"
                        />
                        <HStack mb={4} justify="space-between" align="flex-start">
                          <Box flex={1}>
                            <HStack mb={2} spacing={2}>
                              <Box
                                w={8}
                                h={8}
                                bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                                borderRadius="5px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <CheckIcon w={4} h={4} color="white" />
                              </Box>
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Context Retention
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" ml={10}>
                              Launched 1 month ago
                            </Text>
                          </Box>
                        </HStack>
                        <VStack align="stretch" spacing={4} mt={5}>
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                                Adoption Rate
                              </Text>
                              <HStack spacing={1}>
                                <ArrowUpIcon w={3} h={3} color="#10b981" />
                                <Text fontSize="xs" fontWeight="600" color="#10b981">+19%</Text>
                              </HStack>
                            </HStack>
                            <HStack spacing={2} align="center">
                              <Text fontSize="2xl" fontWeight="700" color="#111827">82%</Text>
                              <Box flex={1} h={2} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                <Box w="82%" h="100%" bg="linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)" borderRadius="full" />
                              </Box>
                            </HStack>
                          </Box>
                          <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="#e5e7eb">
                            <Box>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Daily Messages</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">18,234</Text>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Satisfaction</Text>
                              <HStack spacing={1} justify="flex-end">
                                <StarIcon w={3} h={3} color="#fbbf24" />
                                <Text fontSize="lg" fontWeight="700" color="#111827">4.8</Text>
                              </HStack>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Active Users</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">4.5k</Text>
                            </Box>
                          </HStack>
                        </VStack>
                      </Box>

                      <Box
                        bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                        borderRadius="6px"
                        p={6}
                        border="1px solid"
                        borderColor="#e5e7eb"
                        boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                        position="relative"
                        overflow="hidden"
                        _hover={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          right={0}
                          w="120px"
                          h="120px"
                          bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                          opacity="0.05"
                          borderRadius="0 0 0 100%"
                        />
                        <HStack mb={4} justify="space-between" align="flex-start">
                          <Box flex={1}>
                            <HStack mb={2} spacing={2}>
                              <Box
                                w={8}
                                h={8}
                                bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                borderRadius="5px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <CheckIcon w={4} h={4} color="white" />
                              </Box>
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Custom System Prompts
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" ml={10}>
                              Launched 3 weeks ago
                            </Text>
                          </Box>
                        </HStack>
                        <VStack align="stretch" spacing={4} mt={5}>
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                                Adoption Rate
                              </Text>
                              <HStack spacing={1}>
                                <ArrowUpIcon w={3} h={3} color="#10b981" />
                                <Text fontSize="xs" fontWeight="600" color="#10b981">+16%</Text>
                              </HStack>
                            </HStack>
                            <HStack spacing={2} align="center">
                              <Text fontSize="2xl" fontWeight="700" color="#111827">65%</Text>
                              <Box flex={1} h={2} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                <Box w="65%" h="100%" bg="linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" borderRadius="full" />
                              </Box>
                            </HStack>
                          </Box>
                          <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="#e5e7eb">
                            <Box>
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Daily Messages</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">9,123</Text>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Satisfaction</Text>
                              <HStack spacing={1} justify="flex-end">
                                <StarIcon w={3} h={3} color="#fbbf24" />
                                <Text fontSize="lg" fontWeight="700" color="#111827">4.7</Text>
                              </HStack>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={1}>Active Users</Text>
                              <Text fontSize="lg" fontWeight="700" color="#111827">2.8k</Text>
                            </Box>
                          </HStack>
                        </VStack>
                      </Box>
                    </Grid>
                  </Box>
                )}

                {/* In-Flight Features Timeframe */}
                <Box mb={10}>
                  <HStack mb={5} spacing={2}>
                    <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                      Roadmap
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
                      4 in progress
                    </Badge>
                  </HStack>
                  <Box
                    bg="#ffffff"
                    borderRadius="6px"
                    p={6}
                    border="1px solid"
                    borderColor="#e5e7eb"
                    boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                  >
                    <VStack align="stretch" spacing={5}>
                      {/* Feature 1 */}
                      <Box pb={5} borderBottom="1px solid" borderColor="#e5e7eb" _last={{ borderBottom: 'none', pb: 0 }}>
                        <HStack mb={4} spacing={4} align="flex-start">
                          <Box
                            w={10}
                            h={10}
                            bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                            borderRadius="6px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <TimeIcon w={5} h={5} color="white" />
                          </Box>
                          <Box flex={1}>
                            <HStack mb={2} spacing={2} flexWrap="wrap">
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Project Health Dashboard
                              </Text>
                              <Badge
                                bg="#dbeafe"
                                color="#2563eb"
                                px={2.5}
                                py={1}
                                borderRadius="4px"
                                fontSize="xs"
                                fontWeight="600"
                              >
                                In Development
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="#6b7280" mb={4} lineHeight="1.6">
                              Real-time project metrics with velocity tracking, risk analytics, and automated health monitoring
                            </Text>
                            <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={3}>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Start Date
                                </Text>
                                <Text fontSize="sm" fontWeight="600" color="#111827">Jan 15, 2024</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Target Date
                                </Text>
                                <Text fontSize="sm" fontWeight="700" color="#2563eb">Mar 1, 2024</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Progress
                                </Text>
                                <HStack spacing={2}>
                                  <Text fontSize="sm" fontWeight="700" color="#111827">65%</Text>
                                  <Box flex={1} h={1.5} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                    <Box w="65%" h="100%" bg="linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)" borderRadius="full" />
                                  </Box>
                                </HStack>
                              </Box>
                            </Grid>
                          </Box>
                        </HStack>
                      </Box>

                      {/* Feature 2 */}
                      <Box pb={5} borderBottom="1px solid" borderColor="#e5e7eb" _last={{ borderBottom: 'none', pb: 0 }}>
                        <HStack mb={4} spacing={4} align="flex-start">
                          <Box
                            w={10}
                            h={10}
                            bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            borderRadius="6px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <TimeIcon w={5} h={5} color="white" />
                          </Box>
                          <Box flex={1}>
                            <HStack mb={2} spacing={2} flexWrap="wrap">
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Multi-Tool Integration
                              </Text>
                              <Badge
                                bg="#fef3c7"
                                color="#d97706"
                                px={2.5}
                                py={1}
                                borderRadius="4px"
                                fontSize="xs"
                                fontWeight="600"
                              >
                                In Design
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="#6b7280" mb={4} lineHeight="1.6">
                              Support for Jira, Asana, Linear, Monday.com, and custom tools with tool-specific AI configurations
                            </Text>
                            <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={3}>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Start Date
                                </Text>
                                <Text fontSize="sm" fontWeight="600" color="#111827">Feb 1, 2024</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Target Date
                                </Text>
                                <Text fontSize="sm" fontWeight="700" color="#d97706">Apr 15, 2024</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Progress
                                </Text>
                                <HStack spacing={2}>
                                  <Text fontSize="sm" fontWeight="700" color="#111827">25%</Text>
                                  <Box flex={1} h={1.5} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                    <Box w="25%" h="100%" bg="linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" borderRadius="full" />
                                  </Box>
                                </HStack>
                              </Box>
                            </Grid>
                          </Box>
                        </HStack>
                      </Box>

                      {/* Feature 3 */}
                      <Box pb={5} borderBottom="1px solid" borderColor="#e5e7eb" _last={{ borderBottom: 'none', pb: 0 }}>
                        <HStack mb={4} spacing={4} align="flex-start">
                          <Box
                            w={10}
                            h={10}
                            bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            borderRadius="6px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <TimeIcon w={5} h={5} color="white" />
                          </Box>
                          <Box flex={1}>
                            <HStack mb={2} spacing={2} flexWrap="wrap">
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                AI-Powered Dependency Analysis
                              </Text>
                              <Badge
                                bg="#dcfce7"
                                color="#16a34a"
                                px={2.5}
                                py={1}
                                borderRadius="4px"
                                fontSize="xs"
                                fontWeight="600"
                              >
                                In Testing
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="#6b7280" mb={4} lineHeight="1.6">
                              Intelligent dependency tracking with automated impact analysis and configurable risk thresholds
                            </Text>
                            <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={3}>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Start Date
                                </Text>
                                <Text fontSize="sm" fontWeight="600" color="#111827">Jan 8, 2024</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Target Date
                                </Text>
                                <Text fontSize="sm" fontWeight="700" color="#16a34a">Feb 20, 2024</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Progress
                                </Text>
                                <HStack spacing={2}>
                                  <Text fontSize="sm" fontWeight="700" color="#111827">85%</Text>
                                  <Box flex={1} h={1.5} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                    <Box w="85%" h="100%" bg="linear-gradient(90deg, #10b981 0%, #059669 100%)" borderRadius="full" />
                                  </Box>
                                </HStack>
                              </Box>
                            </Grid>
                          </Box>
                        </HStack>
                      </Box>

                      {/* Feature 4 */}
                      <Box>
                        <HStack mb={4} spacing={4} align="flex-start">
                          <Box
                            w={10}
                            h={10}
                            bg="linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)"
                            borderRadius="6px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <TimeIcon w={5} h={5} color="white" />
                          </Box>
                          <Box flex={1}>
                            <HStack mb={2} spacing={2} flexWrap="wrap">
                              <Text fontSize="lg" fontWeight="700" color="#111827">
                                Enterprise Team Management
                              </Text>
                              <Badge
                                bg="#e9d5ff"
                                color="#9333ea"
                                px={2.5}
                                py={1}
                                borderRadius="4px"
                                fontSize="xs"
                                fontWeight="600"
                              >
                                Planned
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="#6b7280" mb={4} lineHeight="1.6">
                              Enterprise-grade team management with unified AI insights across all projects and automated executive reporting
                            </Text>
                            <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={3}>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Start Date
                                </Text>
                                <Text fontSize="sm" fontWeight="600" color="#111827">Mar 1, 2024</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Target Date
                                </Text>
                                <Text fontSize="sm" fontWeight="700" color="#9333ea">May 15, 2024</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="#9ca3af" fontWeight="500" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                                  Progress
                                </Text>
                                <HStack spacing={2}>
                                  <Text fontSize="sm" fontWeight="700" color="#111827">0%</Text>
                                  <Box flex={1} h={1.5} bg="#e5e7eb" borderRadius="full" overflow="hidden">
                                    <Box w="0%" h="100%" bg="linear-gradient(90deg, #9333ea 0%, #7e22ce 100%)" borderRadius="full" />
                                  </Box>
                                </HStack>
                              </Box>
                            </Grid>
                          </Box>
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>
                </Box>

                {/* Opportunity Radar */}
                <Box mb={10}>
                  <HStack mb={5} spacing={2} justify="space-between">
                    <HStack spacing={2}>
                      <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                        Opportunity Radar
                      </Heading>
                      <Badge bg="#f3f4f6" color="#4b5563" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                        What to build next
                      </Badge>
                    </HStack>
                    <Button
                      size="sm"
                      onClick={() => setWeakSignalMode(!weakSignalMode)}
                      bg={weakSignalMode ? '#4b5563' : '#f3f4f6'}
                      color={weakSignalMode ? 'white' : '#4b5563'}
                      fontWeight="600"
                      _hover={{ bg: weakSignalMode ? '#374151' : '#e5e7eb' }}
                    >
                      {weakSignalMode ? 'Standard View' : 'Weak-Signal Mode'}
                    </Button>
                  </HStack>
                  <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={5}>
                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="2px solid"
                      borderColor="#10b981"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2}>
                        <Badge bg="#dcfce7" color="#16a34a" px={3} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                          BUILD
                        </Badge>
                        <Badge bg="#f3f4f6" color="#4b5563" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                          Confidence: 92%
                        </Badge>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={3}>
                        {selectedProduct === 'pmai' ? 'Jira Integration' : 'Prompt Version Control'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? 'PMs requesting Jira integration for seamless workflow. 45 mentions across 8 sources. High specificity with detailed use cases.'
                          : 'Developers need version control for prompts. 38 mentions, strong workaround signals (users using Git manually).'}
                      </Text>
                      <VStack align="stretch" spacing={2} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">Evidence Sources</Text>
                          <Text fontWeight="700" color="#111827">8 sources</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">Specificity Score</Text>
                          <Text fontWeight="700" color="#10b981">High</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">ICP Fit</Text>
                          <Text fontWeight="700" color="#111827">95%</Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="2px solid"
                      borderColor="#f59e0b"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2}>
                        <Badge bg="#fef3c7" color="#d97706" px={3} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                          EXPLORE
                        </Badge>
                        <Badge bg="#f3f4f6" color="#4b5563" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                          Confidence: 68%
                        </Badge>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={3}>
                        {selectedProduct === 'pmai' ? 'Predictive Resource Allocation' : 'Multi-Agent Conversations'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? 'Early signals for AI-powered resource allocation. 12 mentions, growing interest. Needs validation with power users.'
                          : 'Users exploring multi-agent setups. 15 mentions, mostly from advanced users. Monitor for growth.'}
                      </Text>
                      <VStack align="stretch" spacing={2} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">Evidence Sources</Text>
                          <Text fontWeight="700" color="#111827">12 sources</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">Specificity Score</Text>
                          <Text fontWeight="700" color="#f59e0b">Medium</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">ICP Fit</Text>
                          <Text fontWeight="700" color="#111827">72%</Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Box
                      bg="#ffffff"
                      borderRadius="6px"
                      p={6}
                      border="2px solid"
                      borderColor="#6b7280"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <HStack mb={4} spacing={2}>
                        <Badge bg="#f3f4f6" color="#4b5563" px={3} py={1} borderRadius="4px" fontSize="xs" fontWeight="700">
                          MONITOR
                        </Badge>
                        <Badge bg="#f3f4f6" color="#4b5563" px={2} py={0.5} borderRadius="3px" fontSize="xs" fontWeight="600">
                          Confidence: 45%
                        </Badge>
                      </HStack>
                      <Text fontSize="lg" fontWeight="700" color="#111827" mb={3}>
                        {selectedProduct === 'pmai' ? 'Mobile PM Dashboard' : 'Prompt Marketplace'}
                      </Text>
                      <Text fontSize="sm" color="#4b5563" mb={4} lineHeight="1.7">
                        {selectedProduct === 'pmai'
                          ? 'Occasional mentions of mobile dashboard. 6 sources, low volume. Track for trend changes.'
                          : 'Some interest in prompt marketplace. 8 mentions, unclear demand. Watch for signals.'}
                      </Text>
                      <VStack align="stretch" spacing={2} pt={4} borderTop="1px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">Evidence Sources</Text>
                          <Text fontWeight="700" color="#111827">6 sources</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">Specificity Score</Text>
                          <Text fontWeight="700" color="#6b7280">Low</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs">
                          <Text color="#6b7280" fontWeight="500">ICP Fit</Text>
                          <Text fontWeight="700" color="#111827">52%</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Grid>
                </Box>

                {/* Streaks + Social Proof */}
                <Box mb={10}>
                  <HStack mb={5} spacing={2}>
                    <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                      Activity & Insights
                    </Heading>
                  </HStack>
                  <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={5}>
                    <Box
                      bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                        Review Streak
                      </Text>
                      <Text fontSize="3xl" fontWeight="700" color="#111827" mb={1}>7</Text>
                      <Text fontSize="sm" color="#4b5563">days in a row</Text>
                    </Box>
                    <Box
                      bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                        Insights Reviewed
                      </Text>
                      <Text fontSize="3xl" fontWeight="700" color="#111827" mb={1}>23</Text>
                      <Text fontSize="sm" color="#4b5563">this week</Text>
                    </Box>
                    <Box
                      bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                        Top Saved Opportunities
                      </Text>
                      <Text fontSize="3xl" fontWeight="700" color="#111827" mb={1}>5</Text>
                      <Text fontSize="sm" color="#4b5563">in your org</Text>
                    </Box>
                    <Box
                      bg="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)"
                      borderRadius="6px"
                      p={6}
                      border="1px solid"
                      borderColor="#e5e7eb"
                      boxShadow="0 2px 8px 0 rgba(0, 0, 0, 0.06)"
                    >
                      <Text fontSize="xs" color="#6b7280" fontWeight="500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                        Actions This Week
                      </Text>
                      <Text fontSize="3xl" fontWeight="700" color="#111827" mb={1}>47</Text>
                      <Text fontSize="sm" color="#4b5563">approved/snoozed</Text>
                    </Box>
                  </Grid>
                </Box>

                {/* Social Media Insights */}
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

        {/* AI Assistant Sidebar */}
        <Box
          position="fixed"
          right={chatOpen ? 0 : '-400px'}
          top={0}
          bottom={0}
          w="400px"
          bg="#ffffff"
          borderLeft="1px solid"
          borderColor="#e5e7eb"
          display="flex"
          flexDirection="column"
          zIndex={1000}
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
              onClick={handleToggleChat}
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

        {/* AI Assistant Toggle Button - Fixed position */}
        <Box
          position="fixed"
          bottom="24px"
          right="24px"
          zIndex={999}
        >
          <IconButton
            icon={<ChatIcon />}
            onClick={handleToggleChat}
            size="lg"
            aria-label="Toggle AI Assistant"
            bg={chatOpen ? 'gray.700' : 'gray.600'}
            color="white"
            borderRadius="50%"
            boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
            _hover={{ bg: 'gray.700', transform: 'scale(1.05)' }}
            _active={{ transform: 'scale(0.95)' }}
            transition="all 0.2s"
            w="56px"
            h="56px"
          />
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
