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
  CircularProgress,
  Chip,
  Button,
  Stepper,
  Step,
  StepLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Description as DocumentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cached as InTransitIcon,
  AccessTime as PendingIcon,
  Flag as FlagIcon,
  LocationOn as LocationIcon,
  Navigation as RouteIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

interface ExportOperationsPillarProps {
  markets: string[];
}

interface Shipment {
  id: string;
  status: string;
  origin: string;
  destination: string;
  departureDate: string;
  estimatedArrival?: string;
  arrivalDate?: string;
  contents: string;
  carrier: string;
  trackingNumber?: string;
  documents: string[];
  customsStatus?: string;
  completedSteps: number;
  totalSteps: number;
}

interface Document {
  name: string;
  required: boolean;
  status: string;
  validUntil?: string;
  notes?: string;
}

interface ShippingRoute {
  name: string;
  duration: string;
  cost: string;
  frequency: string;
}

interface Logistics {
  preferredCarriers: string[];
  averageTransitTime: string;
  customsAgent: string;
  warehousePartners: string[];
  shippingRoutes: ShippingRoute[];
}

interface MarketExportData {
  shipments: Shipment[];
  logistics: Logistics;
  documents: Document[];
}

// Mock export operations data
const mockExportData = {
  'United Kingdom': {
    shipments: [
      {
        id: 'ship-uk-1',
        status: 'in_transit',
        origin: 'Valencia, Spain',
        destination: 'London, UK',
        departureDate: '2024-07-15',
        estimatedArrival: '2024-07-22',
        contents: 'Dried fruits assortment - 1,200kg',
        carrier: 'EuroFreight Services',
        trackingNumber: 'EFS-98721-UK',
        documents: ['Commercial Invoice', 'Packing List', 'Bill of Lading'],
        customsStatus: 'Cleared',
        completedSteps: 3,
        totalSteps: 5
      },
      {
        id: 'ship-uk-2',
        status: 'scheduled',
        origin: 'Valencia, Spain',
        destination: 'Manchester, UK',
        departureDate: '2024-08-10',
        estimatedArrival: '2024-08-17',
        contents: 'Premium nut mix - 800kg',
        carrier: 'EuroFreight Services',
        documents: ['Commercial Invoice', 'Packing List'],
        customsStatus: 'Pending',
        completedSteps: 1,
        totalSteps: 5
      }
    ],
    logistics: {
      preferredCarriers: ['EuroFreight Services', 'UK Logistics Ltd'],
      averageTransitTime: '7-9 days',
      customsAgent: 'UK Customs Specialists',
      warehousePartners: ['London Distribution Center', 'Manchester Fulfillment Hub'],
      shippingRoutes: [
        {
          name: 'Valencia to London (Sea)',
          duration: '7-9 days',
          cost: '€2,400 per container',
          frequency: 'Weekly departures (Monday, Thursday)'
        },
        {
          name: 'Valencia to London (Road)',
          duration: '3-4 days',
          cost: '€3,600 per truck',
          frequency: 'Daily departures'
        }
      ]
    },
    documents: [
      {
        name: 'EUR.1 Movement Certificate',
        required: true,
        status: 'available',
        validUntil: '2025-01-15'
      },
      {
        name: 'Phytosanitary Certificate',
        required: true,
        status: 'available',
        validUntil: '2024-10-20'
      },
      {
        name: 'Certificate of Origin',
        required: true,
        status: 'available',
        validUntil: '2024-12-31'
      }
    ]
  },
  'European Union': {
    shipments: [
      {
        id: 'ship-eu-1',
        status: 'delivered',
        origin: 'Valencia, Spain',
        destination: 'Berlin, Germany',
        departureDate: '2024-06-05',
        arrivalDate: '2024-06-08',
        contents: 'Mixed dried fruits - 1,500kg',
        carrier: 'EU Transport Solutions',
        trackingNumber: 'EUTS-45672-DE',
        documents: ['Commercial Invoice', 'Packing List', 'CMR Consignment Note'],
        completedSteps: 5,
        totalSteps: 5
      }
    ],
    logistics: {
      preferredCarriers: ['EU Transport Solutions', 'Euro Logistics'],
      averageTransitTime: '2-4 days',
      customsAgent: 'Not required (Single Market)',
      warehousePartners: ['Berlin Distribution Hub', 'Hamburg Logistics Center'],
      shippingRoutes: [
        {
          name: 'Valencia to Berlin (Road)',
          duration: '2-4 days',
          cost: '€2,800 per truck',
          frequency: 'Daily departures'
        }
      ]
    },
    documents: [
      {
        name: 'EU Intrastat Declaration',
        required: true,
        status: 'available',
        validUntil: 'Monthly filing'
      }
    ]
  },
  'United Arab Emirates': {
    shipments: [],
    logistics: {
      preferredCarriers: ['Global Maritime Shipping', 'UAE Air Cargo'],
      averageTransitTime: '15-20 days (Sea), 3-4 days (Air)',
      customsAgent: 'Dubai Customs Brokers LLC',
      warehousePartners: ['Dubai LogiCenter'],
      shippingRoutes: [
        {
          name: 'Valencia to Dubai (Sea)',
          duration: '15-20 days',
          cost: '$3,200 per container',
          frequency: 'Weekly departures (Wednesday)'
        },
        {
          name: 'Valencia to Dubai (Air)',
          duration: '3-4 days',
          cost: '$7.50 per kg',
          frequency: 'Twice weekly (Monday, Friday)'
        }
      ]
    },
    documents: [
      {
        name: 'Certificate of Origin',
        required: true,
        status: 'not_started',
        notes: 'Must be authenticated by UAE embassy'
      },
      {
        name: 'Commercial Invoice',
        required: true,
        status: 'not_started'
      },
      {
        name: 'Packing List',
        required: true,
        status: 'not_started'
      },
      {
        name: 'Import Permit',
        required: true,
        status: 'not_started'
      }
    ]
  }
};

const ExportOperationsPillar: React.FC<ExportOperationsPillarProps> = ({ markets }) => {
  const [activeMarket, setActiveMarket] = useState<string>(markets[0] || 'United Kingdom');
  const [activeTab, setActiveTab] = useState<string>('shipments');
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
  
  // Get export data for the selected market
  const exportData = mockExportData[activeMarket as keyof typeof mockExportData] as MarketExportData | null;
  
  // Get shipment status label and color
  const getShipmentStatusInfo = (status: string) => {
    switch(status) {
      case 'delivered':
        return { label: 'Delivered', color: 'success', icon: <CheckCircleIcon /> };
      case 'in_transit':
        return { label: 'In Transit', color: 'primary', icon: <InTransitIcon /> };
      case 'scheduled':
        return { label: 'Scheduled', color: 'info', icon: <ScheduleIcon /> };
      default:
        return { label: 'Pending', color: 'default', icon: <PendingIcon /> };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Export Operations
        </Typography>
        
        <Typography variant="body1" paragraph>
          Manage and track your export operations, logistics, and shipment processes.
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
        ) : exportData ? (
          <>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ mb: 3 }}
            >
              <Tab label="Shipments" value="shipments" />
              <Tab label="Logistics" value="logistics" />
              <Tab label="Documents" value="documents" />
            </Tabs>
            
            {activeTab === 'shipments' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Shipments to {activeMarket}
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      New Shipment
                    </Button>
                  </Box>
                  
                  {exportData.shipments.length > 0 ? (
                    exportData.shipments.map((shipment) => {
                      const statusInfo = getShipmentStatusInfo(shipment.status);
                      
                      return (
                        <Card key={shipment.id} variant="outlined" sx={{ mb: 3 }}>
                          <CardContent sx={{ pb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6">
                                  Shipment {shipment.trackingNumber || 'Pending'}
                                </Typography>
                              </Box>
                              <Chip 
                                icon={statusInfo.icon} 
                                label={statusInfo.label} 
                                color={statusInfo.color as any} 
                                size="small"
                              />
                            </Box>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={5}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Route Information
                                  </Typography>
                                  
                                  <List dense>
                                    <ListItem>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <LocationIcon fontSize="small" />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary="Origin" 
                                        secondary={shipment.origin} 
                                      />
                                    </ListItem>
                                    
                                    <ListItem>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <FlagIcon fontSize="small" />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary="Destination" 
                                        secondary={shipment.destination} 
                                      />
                                    </ListItem>
                                    
                                    <ListItem>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <RouteIcon fontSize="small" />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary="Carrier" 
                                        secondary={shipment.carrier} 
                                      />
                                    </ListItem>
                                  </List>
                                </Box>
                                
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Time Information
                                  </Typography>
                                  
                                  <List dense>
                                    <ListItem>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <ScheduleIcon fontSize="small" />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary="Departure Date" 
                                        secondary={shipment.departureDate} 
                                      />
                                    </ListItem>
                                    
                                    <ListItem>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <ScheduleIcon fontSize="small" />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={shipment.status === 'delivered' ? 'Arrival Date' : 'Estimated Arrival'} 
                                        secondary={shipment.status === 'delivered' 
                                          ? (shipment as any).arrivalDate 
                                          : (shipment as any).estimatedArrival} 
                                      />
                                    </ListItem>
                                  </List>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={7}>
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Progress
                                  </Typography>
                                  
                                  <Stepper activeStep={shipment.completedSteps} alternativeLabel>
                                    <Step>
                                      <StepLabel>Order Placed</StepLabel>
                                    </Step>
                                    <Step>
                                      <StepLabel>Documents Prepared</StepLabel>
                                    </Step>
                                    <Step>
                                      <StepLabel>Customs Clearance</StepLabel>
                                    </Step>
                                    <Step>
                                      <StepLabel>In Transit</StepLabel>
                                    </Step>
                                    <Step>
                                      <StepLabel>Delivered</StepLabel>
                                    </Step>
                                  </Stepper>
                                </Box>
                                
                                <Divider sx={{ mb: 2 }} />
                                
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Shipment Details
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Contents:
                                      </Typography>
                                      <Typography variant="body2">
                                        {shipment.contents}
                                      </Typography>
                                    </Grid>
                                    
                                    {(shipment as any).customsStatus && (
                                      <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                          Customs Status:
                                        </Typography>
                                        <Typography variant="body2">
                                          {(shipment as any).customsStatus}
                                        </Typography>
                                      </Grid>
                                    )}
                                    
                                    <Grid item xs={12}>
                                      <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Documents:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {shipment.documents.map((doc, index) => (
                                          <Chip 
                                            key={index} 
                                            label={doc} 
                                            size="small" 
                                            icon={<DocumentIcon />}
                                            variant="outlined"
                                          />
                                        ))}
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pb: 2 }}>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              endIcon={<ArrowForwardIcon />}
                            >
                              Track Shipment
                            </Button>
                          </Box>
                        </Card>
                      );
                    })
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No shipments scheduled for {activeMarket} yet.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<AddIcon />} 
                        sx={{ mt: 2 }}
                      >
                        Schedule First Shipment
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
            
            {activeTab === 'logistics' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Logistics Information for {activeMarket}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      Add Logistics Partner
                    </Button>
                  </Box>
                  
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Overview
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6} lg={3}>
                          <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Average Transit Time
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 1 }}>
                              {exportData.logistics.averageTransitTime}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6} lg={3}>
                          <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Customs Agent
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 1 }}>
                              {exportData.logistics.customsAgent}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6} lg={3}>
                          <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Preferred Carriers
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {exportData.logistics.preferredCarriers.map((carrier, index) => (
                                <Chip key={index} label={carrier} size="small" />
                              ))}
                            </Box>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6} lg={3}>
                          <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Warehouse Partners
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {exportData.logistics.warehousePartners.map((warehouse, index) => (
                                <Chip key={index} label={warehouse} size="small" />
                              ))}
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Available Shipping Routes
                      </Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Route</TableCell>
                              <TableCell>Duration</TableCell>
                              <TableCell>Cost</TableCell>
                              <TableCell>Frequency</TableCell>
                              <TableCell align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {exportData.logistics.shippingRoutes.map((route, index) => (
                              <TableRow key={index}>
                                <TableCell>{route.name}</TableCell>
                                <TableCell>{route.duration}</TableCell>
                                <TableCell>{route.cost}</TableCell>
                                <TableCell>{route.frequency}</TableCell>
                                <TableCell align="right">
                                  <Button 
                                    variant="outlined" 
                                    size="small"
                                  >
                                    Select
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            {activeTab === 'documents' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Required Documents for {activeMarket}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      Add Document
                    </Button>
                  </Box>
                  
                  {exportData.documents.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Document</TableCell>
                            <TableCell>Required</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Validity</TableCell>
                            <TableCell>Notes</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {exportData.documents.map((document, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                  <Typography variant="body2">
                                    {document.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={document.required ? 'Required' : 'Optional'} 
                                  size="small" 
                                  color={document.required ? 'error' : 'default'} 
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={
                                    document.status === 'available' ? 'Available' : 
                                    document.status === 'in_progress' ? 'In Progress' : 'Not Started'
                                  } 
                                  size="small" 
                                  color={
                                    document.status === 'available' ? 'success' : 
                                    document.status === 'in_progress' ? 'primary' : 'default'
                                  } 
                                />
                              </TableCell>
                              <TableCell>
                                {(document as Document).validUntil || '-'}
                              </TableCell>
                              <TableCell>
                                {(document as Document).notes || '-'}
                              </TableCell>
                              <TableCell align="right">
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  startIcon={
                                    document.status === 'available' ? <CheckCircleIcon /> : 
                                    document.status === 'in_progress' ? <InTransitIcon /> : <AddIcon />
                                  }
                                >
                                  {document.status === 'available' ? 'View' : 
                                   document.status === 'in_progress' ? 'Complete' : 'Start'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No document requirements defined for {activeMarket} yet.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<AddIcon />} 
                        sx={{ mt: 2 }}
                      >
                        Add Documents
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No export data available for {activeMarket}. Please select another market.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ExportOperationsPillar; 