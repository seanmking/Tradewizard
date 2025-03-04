import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Alert,
  LinearProgress,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Description as DocumentIcon,
  Assignment as TaskIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon,
  CheckBox as CheckBoxIcon
} from '@mui/icons-material';

interface RegulatoryCompliancePillarProps {
  markets: string[];
}

// Add interface definitions for requirement types
interface RequirementDocument {
  name: string;
  completed: boolean;
}

interface Requirement {
  id: string;
  name: string;
  category: string;
  description: string;
  required: boolean;
  status: string;
  obtainmentTime: string;
  cost: string;
  validityPeriod: string;
  renewalProcess?: string;
  authority: string;
  documents: RequirementDocument[];
  recommendedFor?: string;
  progress?: number;
}

interface RegulatoryData {
  requirements: Requirement[];
  complianceScore: number;
  nextDeadline: string;
  nextDeadlineItem: string;
  totalEstimatedCost: string;
  totalEstimatedTime: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface ComplianceTask {
  id: string;
  title: string;
  market: string;
  description: string;
  priority: string;
  deadline: string;
  status: string;
  progress: number;
  subtasks: Subtask[];
}

// Mock regulatory data
const mockRegulatoryData = {
  'United Kingdom': {
    requirements: [
      {
        id: 'uk-1',
        name: 'Food Safety Certificate',
        category: 'Food Safety',
        description: 'Certificate confirming compliance with UK food safety regulations.',
        required: true,
        status: 'completed',
        obtainmentTime: '2-4 weeks',
        cost: '£250-350',
        validityPeriod: '2 years',
        renewalProcess: 'Simplified renewal process 30 days before expiry',
        authority: 'UK Food Standards Agency',
        documents: [
          { name: 'Application Form FSA-22', completed: true },
          { name: 'Product Specifications', completed: true },
          { name: 'Lab Test Results', completed: true }
        ]
      },
      {
        id: 'uk-2',
        name: 'Health Certificate',
        category: 'Health & Safety',
        description: 'Certificate confirming products meet health standards.',
        required: true,
        status: 'in_progress',
        progress: 65,
        obtainmentTime: '3-5 weeks',
        cost: '£180-220',
        validityPeriod: '1 year',
        renewalProcess: 'Full application required for renewal',
        authority: 'Department of Health',
        documents: [
          { name: 'Health Declaration Form', completed: true },
          { name: 'Product Ingredient List', completed: true },
          { name: 'Nutritional Analysis', completed: false }
        ]
      },
      {
        id: 'uk-3',
        name: 'Organic Certification',
        category: 'Product Certification',
        description: 'Certification for products labeled as organic.',
        required: false,
        status: 'not_started',
        obtainmentTime: '8-12 weeks',
        cost: '£450-700',
        validityPeriod: '1 year',
        renewalProcess: 'Annual inspection and review',
        authority: 'Soil Association',
        recommendedFor: 'Products marketed as organic or natural',
        documents: [
          { name: 'Organic Production Methods Documentation', completed: false },
          { name: 'Supply Chain Verification', completed: false },
          { name: 'Field and Facility Inspection', completed: false }
        ]
      }
    ],
    complianceScore: 78,
    nextDeadline: '2024-10-15',
    nextDeadlineItem: 'Health Certificate Renewal',
    totalEstimatedCost: '£430-570',
    totalEstimatedTime: '5-9 weeks'
  },
  'European Union': {
    requirements: [
      {
        id: 'eu-1',
        name: 'CE Marking',
        category: 'Product Safety',
        description: 'Mandatory conformity marking for products sold in the EEA.',
        required: true,
        status: 'in_progress',
        progress: 40,
        obtainmentTime: '4-6 weeks',
        cost: '€300-450',
        validityPeriod: 'Unlimited (unless regulations change)',
        authority: 'Self-declaration with notified body assessment',
        documents: [
          { name: 'Technical Documentation', completed: true },
          { name: 'EU Declaration of Conformity', completed: false },
          { name: 'Product Safety Testing Report', completed: false }
        ]
      },
      {
        id: 'eu-2',
        name: 'EU Organic Logo License',
        category: 'Product Certification',
        description: 'Authorization to use the EU organic logo on products.',
        required: false,
        status: 'not_started',
        obtainmentTime: '10-14 weeks',
        cost: '€500-800',
        validityPeriod: '1 year',
        renewalProcess: 'Annual inspection and certification',
        authority: 'EU-approved organic certification bodies',
        recommendedFor: 'Products marketed as organic',
        documents: [
          { name: 'Organic Production Methods Documentation', completed: false },
          { name: 'Processing Facility Certification', completed: false },
          { name: 'Ingredient Sourcing Verification', completed: false }
        ]
      }
    ],
    complianceScore: 52,
    nextDeadline: '2024-09-30',
    nextDeadlineItem: 'CE Marking Documentation',
    totalEstimatedCost: '€300-450',
    totalEstimatedTime: '4-6 weeks'
  },
  'United Arab Emirates': {
    requirements: [
      {
        id: 'uae-1',
        name: 'ESMA Product Registration',
        category: 'Product Registration',
        description: 'Registration with Emirates Authority for Standardization and Metrology.',
        required: true,
        status: 'not_started',
        obtainmentTime: '6-8 weeks',
        cost: 'AED 2,000-3,500',
        validityPeriod: '1 year',
        renewalProcess: 'Renewal application 1 month before expiry',
        authority: 'Emirates Authority for Standardization (ESMA)',
        documents: [
          { name: 'Product Details and Specifications', completed: false },
          { name: 'Test Reports from Accredited Lab', completed: false },
          { name: 'Product Images and Label Artwork', completed: false }
        ]
      },
      {
        id: 'uae-2',
        name: 'Halal Certification',
        category: 'Product Certification',
        description: 'Certification confirming products meet Halal requirements.',
        required: false,
        status: 'not_started',
        obtainmentTime: '4-8 weeks',
        cost: 'AED 4,000-7,000',
        validityPeriod: '1 year',
        renewalProcess: 'Re-application required annually',
        authority: 'Emirates Authority for Standardization (ESMA)',
        recommendedFor: 'All food products (strongly recommended for UAE market)',
        documents: [
          { name: 'Ingredient Declaration', completed: false },
          { name: 'Manufacturing Process Documentation', completed: false },
          { name: 'Halal Compliance Statement', completed: false }
        ]
      }
    ],
    complianceScore: 0,
    nextDeadline: '2024-11-15',
    nextDeadlineItem: 'ESMA Registration Submission',
    totalEstimatedCost: 'AED 6,000-10,500',
    totalEstimatedTime: '10-16 weeks'
  }
};

// Compliance tasks
const complianceTasks = [
  {
    id: 'task-1',
    title: 'Complete UK Health Certificate Application',
    market: 'United Kingdom',
    description: 'Submit remaining documentation for Health Certificate',
    priority: 'high',
    deadline: '2024-08-20',
    status: 'in_progress',
    progress: 65,
    subtasks: [
      { id: 'subtask-1-1', title: 'Prepare nutritional analysis', completed: false },
      { id: 'subtask-1-2', title: 'Submit final application form', completed: false }
    ]
  },
  {
    id: 'task-2',
    title: 'Finalize CE Marking Documentation',
    market: 'European Union',
    description: 'Complete technical documentation and declaration of conformity',
    priority: 'medium',
    deadline: '2024-09-30',
    status: 'in_progress',
    progress: 40,
    subtasks: [
      { id: 'subtask-2-1', title: 'Complete product safety testing', completed: false },
      { id: 'subtask-2-2', title: 'Prepare EU declaration of conformity', completed: false },
      { id: 'subtask-2-3', title: 'Arrange for notified body assessment', completed: false }
    ]
  },
  {
    id: 'task-3',
    title: 'Initiate ESMA Registration Process',
    market: 'United Arab Emirates',
    description: 'Start the product registration process with ESMA',
    priority: 'low',
    deadline: '2024-11-15',
    status: 'not_started',
    progress: 0,
    subtasks: [
      { id: 'subtask-3-1', title: 'Prepare product specifications', completed: false },
      { id: 'subtask-3-2', title: 'Arrange for product testing', completed: false },
      { id: 'subtask-3-3', title: 'Prepare label artwork', completed: false }
    ]
  }
];

const RegulatoryCompliancePillar: React.FC<RegulatoryCompliancePillarProps> = ({ markets }) => {
  const [activeMarket, setActiveMarket] = useState<string>(markets[0] || 'United Kingdom');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleMarketChange = (_event: React.SyntheticEvent, newValue: string) => {
    setIsLoading(true);
    setActiveMarket(newValue);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  
  // Get regulatory data for the selected market
  const regulatoryData = mockRegulatoryData[activeMarket as keyof typeof mockRegulatoryData] as RegulatoryData | null;
  
  // Get tasks for the selected market
  const marketTasks = complianceTasks.filter(task => task.market === activeMarket);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Regulatory Compliance
        </Typography>
        
        <Typography variant="body1" paragraph>
          Track and manage regulatory requirements for your target export markets. Ensure compliance with
          all mandatory certifications and standards to avoid delays and penalties.
        </Typography>
        
        <Tabs
          value={activeMarket}
          onChange={handleMarketChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          {markets.map(market => (
            <Tab key={market} label={market} value={market} />
          ))}
        </Tabs>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : regulatoryData ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                        <CircularProgress 
                          variant="determinate" 
                          value={regulatoryData.complianceScore} 
                          size={60}
                          thickness={5}
                          sx={{ 
                            color: regulatoryData.complianceScore > 75 ? 'success.main' : 
                                   regulatoryData.complianceScore > 50 ? 'warning.main' : 'error.main'
                          }}
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" component="div" color="text.secondary">
                            {regulatoryData.complianceScore}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Compliance Score
                        </Typography>
                        <Typography variant="body2">
                          {regulatoryData.complianceScore > 75 ? 'Good' : 
                           regulatoryData.complianceScore > 50 ? 'Needs Attention' : 'Critical'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Estimated Time to Full Compliance
                        </Typography>
                        <Typography variant="body2">
                          {regulatoryData.totalEstimatedTime}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Next Deadline
                        </Typography>
                        <Typography variant="body2">
                          {regulatoryData.nextDeadline} - {regulatoryData.nextDeadlineItem}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
            
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ mb: 3 }}
            >
              <Tab label="Overview" value="overview" />
              <Tab label="Requirements" value="requirements" />
              <Tab label="Tasks" value="tasks" />
            </Tabs>
            
            {activeTab === 'overview' && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Compliance Summary for {activeMarket}
                      </Typography>
                      
                      <Alert 
                        severity={
                          regulatoryData.complianceScore > 75 ? "success" : 
                          regulatoryData.complianceScore > 50 ? "warning" : "error"
                        } 
                        sx={{ mb: 3 }}
                      >
                        {regulatoryData.complianceScore > 75 ? 
                          "Your compliance status for this market is good. Continue maintaining documentation and monitoring changes." : 
                          regulatoryData.complianceScore > 50 ? 
                          "Your compliance status needs attention. Complete the in-progress requirements to improve." :
                          "Your compliance status is critical. Immediate action required to meet regulatory requirements."}
                      </Alert>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Required Documents Status
                      </Typography>
                      
                      <TableContainer sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Requirement</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Est. Time</TableCell>
                              <TableCell>Est. Cost</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {regulatoryData.requirements
                              .filter(req => req.required)
                              .map((req) => (
                                <TableRow key={req.id}>
                                  <TableCell>{req.name}</TableCell>
                                  <TableCell>{req.category}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      size="small"
                                      label={
                                        req.status === 'completed' ? 'Completed' :
                                        req.status === 'in_progress' ? 'In Progress' : 'Not Started'
                                      }
                                      color={
                                        req.status === 'completed' ? 'success' :
                                        req.status === 'in_progress' ? 'primary' : 'default'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>{req.obtainmentTime}</TableCell>
                                  <TableCell>{req.cost}</TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Recommended (Optional) Documents
                      </Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Requirement</TableCell>
                              <TableCell>Recommended For</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Est. Time</TableCell>
                              <TableCell>Est. Cost</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {regulatoryData.requirements
                              .filter(req => !req.required)
                              .map((req) => (
                                <TableRow key={req.id}>
                                  <TableCell>{req.name}</TableCell>
                                  <TableCell>{req.recommendedFor}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      size="small"
                                      label={
                                        req.status === 'completed' ? 'Completed' :
                                        req.status === 'in_progress' ? 'In Progress' : 'Not Started'
                                      }
                                      color={
                                        req.status === 'completed' ? 'success' :
                                        req.status === 'in_progress' ? 'primary' : 'default'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>{req.obtainmentTime}</TableCell>
                                  <TableCell>{req.cost}</TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={5}>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Next Steps
                      </Typography>
                      
                      {marketTasks.length > 0 ? (
                        <List>
                          {marketTasks.map((task) => (
                            <ListItem key={task.id} sx={{ px: 0 }}>
                              <ListItemIcon>
                                {task.priority === 'high' ? 
                                  <ErrorIcon color="error" /> : 
                                  task.priority === 'medium' ? 
                                  <WarningIcon color="warning" /> : 
                                  <InfoIcon color="info" />
                                }
                              </ListItemIcon>
                              <ListItemText 
                                primary={task.title} 
                                secondary={`Due: ${task.deadline} | ${task.status === 'completed' ? 'Completed' : 
                                          task.status === 'in_progress' ? 'In Progress' : 'Not Started'}`}
                              />
                              <Button 
                                variant="outlined" 
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                              >
                                View
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No pending tasks for this market.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Compliance Tips
                      </Typography>
                      
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <CheckBoxIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Start the process early" 
                            secondary="Regulatory approvals can take longer than expected"
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <CheckBoxIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Prepare clear documentation" 
                            secondary="Well-organized applications reduce processing time"
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <CheckBoxIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Consider working with a local agent" 
                            secondary="Local expertise can facilitate smoother approvals"
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <CheckBoxIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Monitor regulatory changes" 
                            secondary="Requirements can change - stay informed"
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            {activeTab === 'requirements' && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Detailed Requirements
                  </Typography>
                  
                  {regulatoryData.requirements.map((requirement) => (
                    <Card key={requirement.id} variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ mr: 1 }}>
                              {requirement.name}
                            </Typography>
                            {requirement.required ? (
                              <Chip size="small" label="Required" color="error" />
                            ) : (
                              <Chip size="small" label="Recommended" color="info" />
                            )}
                          </Box>
                          <Chip 
                            label={
                              requirement.status === 'completed' ? 'Completed' :
                              requirement.status === 'in_progress' ? 'In Progress' : 'Not Started'
                            }
                            color={
                              requirement.status === 'completed' ? 'success' :
                              requirement.status === 'in_progress' ? 'primary' : 'default'
                            }
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {requirement.description}
                        </Typography>
                        
                        {requirement.status === 'in_progress' && (requirement as Requirement).progress !== undefined && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="body2">Progress</Typography>
                              <Typography variant="body2">{(requirement as Requirement).progress}%</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(requirement as Requirement).progress!} 
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        )}
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} md={6}>
                            <List dense>
                              <ListItem>
                                <ListItemIcon>
                                  <InfoIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Category" 
                                  secondary={requirement.category}
                                />
                              </ListItem>
                              
                              <ListItem>
                                <ListItemIcon>
                                  <InfoIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Time to Obtain" 
                                  secondary={requirement.obtainmentTime}
                                />
                              </ListItem>
                              
                              <ListItem>
                                <ListItemIcon>
                                  <InfoIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Estimated Cost" 
                                  secondary={requirement.cost}
                                />
                              </ListItem>
                            </List>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <List dense>
                              <ListItem>
                                <ListItemIcon>
                                  <InfoIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Issuing Authority" 
                                  secondary={requirement.authority}
                                />
                              </ListItem>
                              
                              <ListItem>
                                <ListItemIcon>
                                  <InfoIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Validity Period" 
                                  secondary={requirement.validityPeriod}
                                />
                              </ListItem>
                              
                              <ListItem>
                                <ListItemIcon>
                                  <InfoIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Renewal Process" 
                                  secondary={requirement.renewalProcess || 'No information available'}
                                />
                              </ListItem>
                            </List>
                          </Grid>
                        </Grid>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Required Documents
                        </Typography>
                        
                        <List dense>
                          {requirement.documents.map((document, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                {document.completed ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <DocumentIcon color="action" fontSize="small" />
                                )}
                              </ListItemIcon>
                              <ListItemText 
                                primary={document.name}
                                primaryTypographyProps={{
                                  style: document.completed ? { textDecoration: 'line-through' } : undefined
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                      
                      <CardActions>
                        <Button 
                          variant={requirement.status === 'not_started' ? 'contained' : 'outlined'} 
                          size="small"
                          sx={{ ml: 'auto' }}
                          endIcon={<ArrowForwardIcon />}
                        >
                          {requirement.status === 'completed' ? 'View Details' : 
                           requirement.status === 'in_progress' ? 'Continue Process' : 'Start Process'}
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'tasks' && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Compliance Tasks
                  </Typography>
                  
                  {marketTasks.length > 0 ? (
                    <>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Complete these tasks to improve regulatory compliance for {activeMarket}.
                      </Typography>
                      
                      {marketTasks.map((task) => (
                        <Card key={task.id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="subtitle1" sx={{ mr: 1 }}>
                                  {task.title}
                                </Typography>
                                <Chip 
                                  size="small" 
                                  label={task.priority} 
                                  color={
                                    task.priority === 'high' ? 'error' : 
                                    task.priority === 'medium' ? 'warning' : 'info'
                                  }
                                />
                              </Box>
                              <Chip 
                                label={
                                  task.status === 'completed' ? 'Completed' :
                                  task.status === 'in_progress' ? 'In Progress' : 'Not Started'
                                }
                                color={
                                  task.status === 'completed' ? 'success' :
                                  task.status === 'in_progress' ? 'primary' : 'default'
                                }
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {task.description}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Deadline: {task.deadline}
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2">Progress</Typography>
                                <Typography variant="body2">{task.progress}%</Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={task.progress} 
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                            
                            <Typography variant="subtitle2" gutterBottom>
                              Subtasks
                            </Typography>
                            
                            <List dense>
                              {task.subtasks.map(subtask => (
                                <ListItem key={subtask.id} disablePadding>
                                  <ListItemIcon sx={{ minWidth: 36 }}>
                                    {subtask.completed ? (
                                      <CheckCircleIcon color="success" fontSize="small" />
                                    ) : (
                                      <TaskIcon color="action" fontSize="small" />
                                    )}
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={subtask.title}
                                    primaryTypographyProps={{
                                      style: subtask.completed ? { textDecoration: 'line-through' } : undefined
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                          
                          <CardActions>
                            <Button 
                              variant={task.status === 'not_started' ? 'contained' : 'outlined'} 
                              size="small"
                              sx={{ ml: 'auto' }}
                              endIcon={<ArrowForwardIcon />}
                            >
                              {task.status === 'not_started' ? 'Start Task' : 'Continue Task'}
                            </Button>
                          </CardActions>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No compliance tasks found for {activeMarket}.
                      </Typography>
                      
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        startIcon={<TaskIcon />}
                      >
                        Create New Task
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No regulatory data available for {activeMarket}. Please select another market.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default RegulatoryCompliancePillar; 