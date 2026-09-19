import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator,
  Search,
  Plus,
  Filter,
  FileText,
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  LayoutGrid,
  List,
  FileDown,
  Send,
  Building2,
  Layers,
  UserCheck,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Zap,
  Sliders,
  FileCheck,
  Camera,
  Shield,
  Trash2,
  Edit3,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Check,
  Percent,
} from 'lucide-react';
import {
  TemplateKey,
  UniversalCostInputs,
  MultiOptionProposalData,
  EstimateRecord,
  HomeownerSpecs,
} from '@/types/estimateTypes';
import {
  DEFAULT_SPECS,
  DEFAULT_SCOPE_ITEMS,
  PAST_ESTIMATES,
  CRM_LEAD_PRESETS,
} from '@/data/estimateData';
import { EstimateClientSearchSelect, UnifiedClientOption } from '@/components/estimates/EstimateClientSearchSelect';
import { EstimatePhotoUploader, PhotoPreset } from '@/components/estimates/EstimatePhotoUploader';
import { EstimateProposalPreview } from '@/components/estimates/EstimateProposalPreview';
import { EstimatePricingEngine } from '@/components/estimates/EstimatePricingEngine';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { UniversalStatCard } from '@/components/common/UniversalStatCard';
import { attachEstimateToClient360 } from '@/lib/client360Store';
import { api, API_ORIGIN } from '@/lib/api';

const PHOTO_1_PRESETS: PhotoPreset[] = [
  {
    label: 'Spanish Tile Villa (Oceanside)',
    url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Coastal Mediterranean Residence',
    url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Modern Clay Tile Estate',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Rancho Santa Fe Estate',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
];

const PHOTO_2_PRESETS: PhotoPreset[] = [
  {
    label: 'TileSeal Peel & Stick Roll (Active)',
    url: '/images/estimates/underlayment_roll.jpg',
  },
  {
    label: 'High-Temp Ice & Water Barrier',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Synthetic Membrane Shield',
    url: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=400&q=80',
  },
];

const PHOTO_3_PRESETS: PhotoPreset[] = [
  {
    label: 'Commercial 4000 PSI Pressure Washer (Active)',
    url: '/images/estimates/pressure_washer.jpg',
  },
  {
    label: 'Soft Wash Exterior Cleaning Rig',
    url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'High-Pressure Surface Wand Kit',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
  },
];

export function EstimatesPage() {
  const [viewMode, setViewMode] = useState<'studio' | 'registry'>('studio');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [previewPage, setPreviewPage] = useState<'page1' | 'page2'>('page1');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('multi_option_proposal');
  const [isManualClient, setIsManualClient] = useState(false);
  const [showPricingEngine, setShowPricingEngine] = useState(false);

  // Email Delivery State
  const [emailSubject, setEmailSubject] = useState(
    'Your Official Roofing Estimate & Proposal - Rise Up Roofing & Construction'
  );
  const [emailMessage, setEmailMessage] = useState(
    'Thank you for the opportunity to estimate your roofing project. Please find attached your official 2-page proposal detailing specifications, scope of work, warranty coverage, and 20-day lock-in savings.'
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentResult, setEmailSentResult] = useState<{
    success: boolean;
    message: string;
    emailId?: string;
    pdfUrl?: string;
    recipient?: string;
  } | null>(null);

  // PDF Generation & Download State
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [downloadedPdfUrl, setDownloadedPdfUrl] = useState<string | null>(null);

  // Shared Cost Inputs for Pricing Engine
  const [costInputs, setCostInputs] = useState<UniversalCostInputs>({
    roofSquares: 25,
    subcontractorLabor: 8500,
    roofingMaterials: 7200,
    disposalFees: 850,
    permitFees: 650,
    plywoodAllowance: 500,
    otherCosts: 400,
    salesCommission: 10,
    commissionIsPct: true,
    selectedMarginPct: 30,
  });

  // Active Multi-Option Proposal Data
  const [proposalData, setProposalData] = useState<MultiOptionProposalData>({
    proposalDate: new Date().toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    }),
    customerName: 'David Martinez',
    customerPhone: '(760) 555-0199',
    customerEmail: 'david.martinez@gmail.com',
    customerAddress: '742 Evergreen Terrace',
    customerCity: 'Escondido, CA 92025',
    roofSquares: 25,
    roofPitch: '4:12 Pitch',
    stories: '1 Story',
    heroPhotoUrl:
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
    optionA: {
      title: 'TILE ROOF LIFT & RELAY',
      subtitle: 'REUSE EXISTING TILES',
      lockInPrice: 26870,
      standardPrice: 31500,
      warranty: '10 YEAR WORKMANSHIP | 30 YEAR MANUFACTURER',
      scopeItems: [
        'Remove and carefully stage existing roof tiles for reuse.',
        'Remove and dispose of existing underlayment.',
        'Inspect decking and replace up to 3 sheets of plywood as needed.',
        'Install new tile roof underlayment.',
        'Install new flashings, drip edge metal, valley metals, and other necessary metals.',
        'Reinstall existing roof tiles.',
        'Replace broken or unusable tiles up to 10% of existing tiles.',
        'Reseal all roof vents and penetrations.',
        'Paint vent components to match existing tile color.',
        'Clean up and remove all debris.',
        'Final inspection and quality walkthrough.',
      ],
    },
    optionB: {
      title: 'COMPLETE NEW TILE ROOF SYSTEM',
      subtitle: '100% NEW TILE INSTALLATION',
      lockInPrice: 32410,
      standardPrice: 37200,
      warranty: '10 YEAR WORKMANSHIP | 30 YEAR MANUFACTURER',
      scopeItems: [
        'Remove and dispose of 100% of existing roof tiles.',
        'Remove and dispose of existing underlayment.',
        'Inspect decking and replace up to 4 sheets of plywood as needed.',
        'Install new tile roof underlayment.',
        'Install new flashings, drip edge metal, valley metals, and other necessary metals.',
        'Install 100% brand-new roof tiles (homeowner to select style & color).',
        'Properly install and secure new tile roofing system.',
        'Reseal all roof vents and penetrations.',
        'Paint vent components to match new tile color.',
        'Clean up and remove all debris.',
        'Final inspection and quality walkthrough.',
      ],
    },
    addon1: {
      title: 'PREMIUM PSU / PEEL-AND-STICK (TILESEAL) UNDERLAYMENT UPGRADE',
      description:
        'Upgrade the standard underlayment to a premium self-adhered peel-and-stick system, such as TileSeal or approved equivalent. Provides a fully adhered secondary water-resistant barrier and improved sealing around fastener penetrations.',
      price: 2000,
      imageUrl: '/images/estimates/underlayment_roll.jpg',
    },
    addon2: {
      title: 'PRESSURE WASHING ADD-ON',
      description:
        'Professional soft wash of roof tiles, exterior surfaces, walkways, and driveway to remove dirt, mold, mildew, and algae.',
      price: 3500,
      imageUrl: '/images/estimates/pressure_washer.jpg',
    },
    lockInDays: 20,
  });

  const [estimates, setEstimates] = useState<EstimateRecord[]>(PAST_ESTIMATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Accepted' | 'Sent' | 'Draft'>('all');
  const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch live estimates from backend on mount
  useEffect(() => {
    const fetchLiveEstimates = async () => {
      try {
        const res = await api.getEstimates();
        if (res?.estimates && Array.isArray(res.estimates) && res.estimates.length > 0) {
          const backendRecords: EstimateRecord[] = res.estimates.map((dbEst: any) => {
            const rawProp = dbEst.proposal_data;
            const parsedProp: MultiOptionProposalData | undefined =
              typeof rawProp === 'string'
                ? JSON.parse(rawProp)
                : rawProp && typeof rawProp === 'object'
                ? rawProp
                : undefined;

            const estDate = dbEst.created_at
              ? new Date(dbEst.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent';

            const quotedTotal = Number(dbEst.total) || 26870;

            return {
              id: String(dbEst.id),
              estimateNumber: dbEst.estimate_number || `EST-${dbEst.id}`,
              date: estDate,
              specs: {
                customerName: dbEst.customer_name || 'Homeowner',
                phone: dbEst.customer_phone || '',
                streetAddress: dbEst.customer_address || '',
                city: dbEst.customer_city || '',
                squares: Number(dbEst.roof_squares) || 25,
                pitch: dbEst.roof_pitch || '4:12',
                pitchMultiplier: 1.0,
                stories: `${dbEst.stories || 1} Story`,
                storyMultiplier: 1.0,
                tearOff: '1_layer',
                tearOffCostPerSq: 45,
              },
              material: {
                materialId: 'tile',
                materialName: dbEst.material_type || 'Tile Roof System',
                costPerSq: 500,
                warranty: '10 Year Workmanship',
                selectedColor: 'Clay Terracotta',
                underlayment: 'premium_synthetic',
                underlaymentCostPerSq: 22,
              },
              scope: DEFAULT_SCOPE_ITEMS,
              tiers: {
                good: {
                  id: 'good',
                  title: 'Option A',
                  name: 'Tile Roof Lift & Relay',
                  total: quotedTotal,
                  monthlyFinancing: Math.round((quotedTotal / 1000) * 12.8),
                  warrantyText: '10 Year Workmanship',
                  underlaymentType: 'Premium Underlayment',
                  features: ['Lift and relay existing tiles', 'Underlayment upgrade'],
                },
                better: {
                  id: 'better',
                  title: 'Option B',
                  name: 'New Tile Roof System',
                  total: Math.round(quotedTotal * 1.2),
                  monthlyFinancing: Math.round(((quotedTotal * 1.2) / 1000) * 12.8),
                  warrantyText: '10 Year Workmanship',
                  underlaymentType: 'Brand-New Tile System',
                  features: ['100% Brand-new tiles', 'Full underlayment shield'],
                  recommended: true,
                },
                best: {
                  id: 'best',
                  title: 'Complete Package',
                  name: 'New Tile System + Upgrades',
                  total: Math.round(quotedTotal * 1.35),
                  monthlyFinancing: Math.round(((quotedTotal * 1.35) / 1000) * 12.8),
                  warrantyText: '10 Year Workmanship',
                  underlaymentType: 'Full Peel-and-Stick Shield',
                  features: ['Brand-new tiles', 'PSU underlayment', 'Pressure washing soft wash'],
                },
              },
              selectedTierId: 'better',
              status:
                dbEst.status === 'accepted'
                  ? 'Accepted'
                  : dbEst.status === 'sent'
                  ? 'Sent'
                  : 'Draft',
              estimatorName: 'Marc Sarellano',
              templateKey: (dbEst.template_key as TemplateKey) || 'multi_option_proposal',
              proposalData: parsedProp,
              pdfUrl: dbEst.pdf_url,
            };
          });

          setEstimates((prev) => {
            const existingNumbers = new Set(backendRecords.map((r) => r.estimateNumber));
            const localOnly = prev.filter((p) => !existingNumbers.has(p.estimateNumber));
            return [...backendRecords, ...localOnly];
          });
        }
      } catch (err) {
        console.warn('Backend estimates fetch error, using local presets:', err);
      }
    };

    fetchLiveEstimates();
  }, []);

  // When a client is selected from the searchable dropdown
  const handleSelectClient = (client: UnifiedClientOption) => {
    setProposalData((prev) => ({
      ...prev,
      customerName: client.name,
      customerPhone: client.phone,
      customerEmail: client.email,
      customerAddress: client.address,
      customerCity: client.city.includes(',') ? client.city : `${client.city}, CA`,
      roofSquares: client.squares || prev.roofSquares,
      roofPitch: client.pitch || prev.roofPitch,
      stories: client.stories || prev.stories,
    }));

    if (client.squares) {
      setCostInputs((prev) => ({
        ...prev,
        roofSquares: client.squares!,
      }));
    }

    setEmailSubject(
      `Your Official Roofing Estimate & Proposal - ${client.name} | Rise Up Roofing`
    );

    showToast(`Loaded ${client.name} into proposal studio!`);
  };

  // Pricing Engine Margins Application
  const handleApplyToOptionA = (price: number) => {
    setProposalData((prev) => ({
      ...prev,
      optionA: {
        ...prev.optionA,
        lockInPrice: price,
        standardPrice: Math.round(price * 1.17),
      },
    }));
    showToast(`Applied $${price.toLocaleString()} to Option A!`);
  };

  const handleApplyToOptionB = (price: number) => {
    setProposalData((prev) => ({
      ...prev,
      optionB: {
        ...prev.optionB,
        lockInPrice: price,
        standardPrice: Math.round(price * 1.15),
      },
    }));
    showToast(`Applied $${price.toLocaleString()} to Option B!`);
  };

  // Save to Database & Registry Only
  const handleSaveToRegistry = async (): Promise<string> => {
    let savedNumber = `EST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let savedId = `est-${Date.now()}`;

    try {
      const saveRes = await api.createEstimate({
        customerName: proposalData.customerName,
        customerPhone: proposalData.customerPhone,
        customerEmail: proposalData.customerEmail,
        customerAddress: proposalData.customerAddress,
        customerCity: proposalData.customerCity,
        roofSquares: proposalData.roofSquares,
        roofPitch: proposalData.roofPitch,
        stories: parseInt(proposalData.stories) || 1,
        templateKey: selectedTemplate,
        proposalData,
        total: proposalData.optionA.lockInPrice,
        marginPct: costInputs.selectedMarginPct,
        notes: `Created via Proposal Studio (${selectedTemplate})`,
      });

      if (saveRes?.estimate?.estimate_number) {
        savedNumber = saveRes.estimate.estimate_number;
        savedId = String(saveRes.estimate.id);
      }
    } catch (err) {
      console.warn('Backend estimate persistence error, using local fallback:', err);
    }

    // Attach to Client 360 profile
    attachEstimateToClient360(proposalData.customerName, {
      estimateNumber: savedNumber,
      total: proposalData.optionA.lockInPrice,
      customerEmail: proposalData.customerEmail,
      customerPhone: proposalData.customerPhone,
      customerAddress: proposalData.customerAddress,
      customerCity: proposalData.customerCity,
      roofSquares: proposalData.roofSquares,
      roofPitch: proposalData.roofPitch,
      stories: proposalData.stories,
      optionA: {
        title: proposalData.optionA.title,
        price: proposalData.optionA.lockInPrice,
      },
      optionB: {
        title: proposalData.optionB.title,
        price: proposalData.optionB.lockInPrice,
      },
      status: 'draft',
    });

    const newEst: EstimateRecord = {
      id: savedId,
      estimateNumber: savedNumber,
      date: 'Today',
      specs: {
        customerName: proposalData.customerName,
        phone: proposalData.customerPhone,
        streetAddress: proposalData.customerAddress,
        city: proposalData.customerCity,
        squares: proposalData.roofSquares,
        pitch: proposalData.roofPitch,
        pitchMultiplier: 1.0,
        stories: proposalData.stories,
        storyMultiplier: 1.0,
        tearOff: '1_layer',
        tearOffCostPerSq: 45,
      },
      material: {
        materialId: 'tile-lift-relay',
        materialName: 'Tile Roof Lift & Relay',
        costPerSq: 520,
        warranty: proposalData.optionA.warranty,
        selectedColor: 'Clay Terracotta',
        underlayment: 'premium_synthetic',
        underlaymentCostPerSq: 22,
      },
      scope: DEFAULT_SCOPE_ITEMS,
      tiers: {
        good: {
          id: 'good',
          title: 'Option A',
          name: proposalData.optionA.title,
          total: proposalData.optionA.lockInPrice,
          monthlyFinancing: Math.round((proposalData.optionA.lockInPrice / 1000) * 12.8),
          warrantyText: proposalData.optionA.warranty,
          underlaymentType: 'Premium Underlayment',
          features: proposalData.optionA.scopeItems.slice(0, 4),
        },
        better: {
          id: 'better',
          title: 'Option B',
          name: proposalData.optionB.title,
          total: proposalData.optionB.lockInPrice,
          monthlyFinancing: Math.round((proposalData.optionB.lockInPrice / 1000) * 12.8),
          warrantyText: proposalData.optionB.warranty,
          underlaymentType: 'Brand-New Tile System',
          features: proposalData.optionB.scopeItems.slice(0, 4),
          recommended: true,
        },
        best: {
          id: 'best',
          title: 'Complete Package',
          name: `${proposalData.optionB.title} + All Add-Ons`,
          total:
            proposalData.optionB.lockInPrice +
            proposalData.addon1.price +
            proposalData.addon2.price,
          monthlyFinancing: Math.round(
            ((proposalData.optionB.lockInPrice +
              proposalData.addon1.price +
              proposalData.addon2.price) /
              1000) *
              12.8
          ),
          warrantyText: proposalData.optionB.warranty,
          underlaymentType: 'Full Peel-and-Stick Shield',
          features: ['All new tiles', 'PSU underlayment', 'Pressure washing soft wash'],
        },
      },
      selectedTierId: 'better',
      status: 'Draft',
      estimatorName: 'Marc Sarellano',
      templateKey: selectedTemplate,
      proposalData,
    };

    setEstimates((prev) => [newEst, ...prev]);
    showToast(`Saved ${newEst.estimateNumber} & synced with Client 360!`);
    return savedNumber;
  };

  // Primary Action: Save Proposal AND Send via Resend Email
  const handleSaveAndSendEmail = async () => {
    if (!proposalData.customerEmail || !proposalData.customerEmail.includes('@')) {
      alert('Please provide a valid client email address to send the proposal.');
      return;
    }

    try {
      setSendingEmail(true);
      setEmailSentResult(null);

      const estNumber = `EST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Dispatch through backend Resend service with official PDF attached
      const emailRes = await api.sendEstimateEmail({
        customerEmail: proposalData.customerEmail,
        customerName: proposalData.customerName,
        estimateNumber: estNumber,
        templateKey: selectedTemplate,
        proposalData: {
          ...proposalData,
          addon_1: {
            title: proposalData.addon1.title,
            description: proposalData.addon1.description,
            price: proposalData.addon1.price,
            image_url: proposalData.addon1.imageUrl || '/images/estimates/underlayment_roll.jpg',
            imageUrl: proposalData.addon1.imageUrl || '/images/estimates/underlayment_roll.jpg',
          },
          addon_2: {
            title: proposalData.addon2.title,
            description: proposalData.addon2.description,
            price: proposalData.addon2.price,
            image_url: proposalData.addon2.imageUrl || '/images/estimates/pressure_washer.jpg',
            imageUrl: proposalData.addon2.imageUrl || '/images/estimates/pressure_washer.jpg',
          },
        },
        subject: emailSubject,
        message: emailMessage,
      });

      if (emailRes && emailRes.ok) {
        // 2. Persist to Database & Client 360 with 'sent' status
        await api.createEstimate({
          customerName: proposalData.customerName,
          customerPhone: proposalData.customerPhone,
          customerEmail: proposalData.customerEmail,
          customerAddress: proposalData.customerAddress,
          customerCity: proposalData.customerCity,
          roofSquares: proposalData.roofSquares,
          roofPitch: proposalData.roofPitch,
          stories: parseInt(proposalData.stories) || 1,
          templateKey: selectedTemplate,
          proposalData,
          total: proposalData.optionA.lockInPrice,
          marginPct: costInputs.selectedMarginPct,
          notes: `Sent via Resend (ID: ${emailRes.emailId})`,
        });

        // 3. Attach to Client 360 profile
        attachEstimateToClient360(proposalData.customerName, {
          estimateNumber: estNumber,
          total: proposalData.optionA.lockInPrice,
          pdfUrl: emailRes.pdfUrl,
          customerEmail: proposalData.customerEmail,
          customerPhone: proposalData.customerPhone,
          customerAddress: proposalData.customerAddress,
          customerCity: proposalData.customerCity,
          roofSquares: proposalData.roofSquares,
          roofPitch: proposalData.roofPitch,
          stories: proposalData.stories,
          optionA: {
            title: proposalData.optionA.title,
            price: proposalData.optionA.lockInPrice,
          },
          optionB: {
            title: proposalData.optionB.title,
            price: proposalData.optionB.lockInPrice,
          },
          status: 'sent',
        });

        setEmailSentResult({
          success: true,
          message: emailRes.message || `Proposal emailed to ${proposalData.customerEmail}`,
          emailId: emailRes.emailId,
          pdfUrl: emailRes.pdfUrl,
          recipient: proposalData.customerEmail,
        });

        showToast(`Official 2-Page Proposal sent to ${proposalData.customerEmail} via Resend!`);
      } else {
        throw new Error('Email dispatch was not acknowledged');
      }
    } catch (err: any) {
      console.error('Failed to send proposal email:', err);
      setEmailSentResult({
        success: false,
        message: err.message || 'Failed to dispatch email. Check backend server and Resend API key.',
      });
      alert(`Email dispatch notice: ${err.message || 'Error communicating with Resend'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Centralized Action: Compile Official 2-Page PDF & Download
  const handleDownloadPdf = async () => {
    try {
      setGeneratingPdf(true);
      const res = await api.generateEstimatePdf({
        templateKey: selectedTemplate,
        proposalData: {
          proposal_date: proposalData.proposalDate,
          customer_name: proposalData.customerName,
          customer_phone: proposalData.customerPhone,
          customer_email: proposalData.customerEmail,
          customer_address: proposalData.customerAddress,
          customer_city: proposalData.customerCity,
          roof_squares: proposalData.roofSquares,
          roof_pitch: proposalData.roofPitch,
          stories: proposalData.stories,
          hero_photo_url: proposalData.heroPhotoUrl,
          option_a: {
            title: proposalData.optionA.title,
            subtitle: proposalData.optionA.subtitle,
            lock_in_price: proposalData.optionA.lockInPrice,
            standard_price: proposalData.optionA.standardPrice,
            warranty: proposalData.optionA.warranty,
            scope_items: proposalData.optionA.scopeItems,
          },
          option_b: {
            title: proposalData.optionB.title,
            subtitle: proposalData.optionB.subtitle,
            lock_in_price: proposalData.optionB.lockInPrice,
            standard_price: proposalData.optionB.standardPrice,
            warranty: proposalData.optionB.warranty,
            scope_items: proposalData.optionB.scopeItems,
          },
          addon_1: {
            title: proposalData.addon1.title,
            description: proposalData.addon1.description,
            price: proposalData.addon1.price,
            image_url: proposalData.addon1.imageUrl || '/images/estimates/underlayment_roll.jpg',
            imageUrl: proposalData.addon1.imageUrl || '/images/estimates/underlayment_roll.jpg',
          },
          addon_2: {
            title: proposalData.addon2.title,
            description: proposalData.addon2.description,
            price: proposalData.addon2.price,
            image_url: proposalData.addon2.imageUrl || '/images/estimates/pressure_washer.jpg',
            imageUrl: proposalData.addon2.imageUrl || '/images/estimates/pressure_washer.jpg',
          },
          lock_in_days: proposalData.lockInDays || 20,
        },
      });

      if (res && res.pdfUrl) {
        const fullUrl = res.pdfUrl.startsWith('http') ? res.pdfUrl : `${API_ORIGIN}${res.pdfUrl}`;
        setDownloadedPdfUrl(fullUrl);
        showToast('Official 2-Page PDF compiled & downloaded successfully!');

        const a = document.createElement('a');
        a.href = fullUrl;
        a.download = res.filename || `RiseUp_Roofing_Proposal_${proposalData.customerName.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      alert('PDF generation error. Please ensure backend server is running on port 8000.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const filteredEstimates = estimates.filter((e) => {
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      e.estimateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.specs.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.specs.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 max-w-[1760px] mx-auto select-none pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles size={14} className="text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Page Hero Header ── */}
      <CrmPageHero
        pageId="estimates"
        defaultEyebrow="RISE UP ROOFING & CONSTRUCTION • PROPOSAL STUDIO & PRICING ENGINE"
        defaultTitle="2-Page Proposal Studio & Live PDF Cockpit"
        defaultSubtitle="Step-wise proposal builder on the left, live 2-page Playwright PDF preview on the right. Instant email dispatch with PDF attachment via Resend."
        showSearch={viewMode === 'registry'}
        searchPlaceholder="Search proposals by client, street, or estimate number..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        searchRef={searchInputRef}
        topRightActions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/90 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('studio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'studio'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calculator size={13} className={viewMode === 'studio' ? 'text-amber-400' : ''} />
                <span>Split Cockpit Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('registry')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'registry'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText size={13} className={viewMode === 'registry' ? 'text-amber-400' : ''} />
                <span>Proposals Registry ({estimates.length})</span>
              </button>
            </div>
          </div>
        }
      />

      {/* ── STUDIO COCKPIT: SPLIT-SCREEN LAYOUT ── */}
      {viewMode === 'studio' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch h-[calc(100vh-170px)] min-h-[780px]">
          {/* ========================================================
              LEFT COLUMN: 3-STEP SYNCHRONIZED PROPOSAL BUILDER (46% width)
              ======================================================== */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col h-full bg-white/70 backdrop-blur-xl rounded-3xl border border-white/85 shadow-md overflow-hidden min-h-0">
            {/* Top Step Ribbon Tabs (3 Stages) */}
            <div className="p-3 bg-slate-100/80 border-b border-slate-200/80 flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setPreviewPage('page1');
                }}
                className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentStep === 1
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    currentStep === 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  1
                </span>
                <span className="truncate">1. Cover &amp; Specs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(2);
                  setPreviewPage('page2');
                }}
                className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentStep === 2
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    currentStep === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  2
                </span>
                <span className="truncate">2. Scope &amp; Options</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentStep === 3
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    currentStep === 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  3
                </span>
                <span className="truncate">3. Summary &amp; Send</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-0">
              {/* ─────────────────────────────────────────────────────────────
                  STEP 1: PAGE 1 (COVER PAGE & PROPERTY SETUP)
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Step 1 Header Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center font-bold">
                        <FileCheck size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Step 1: Proposal Cover &amp; Property Setup
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Template, client contact, proposal date, hero photo &amp; roof specs.
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-black uppercase">
                      <span>Cover Preview Active</span>
                      <ArrowRight size={10} />
                    </span>
                  </div>

                  {/* 1. Estimate Template Format Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-sky-600" />
                      <span>Estimate Template Format:</span>
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value as TemplateKey)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
                    >
                      <option value="multi_option_proposal">
                        Roofing Proposal (2-Page Multi-Option • Active)
                      </option>
                      <option value="standard_roofing_estimate" disabled>
                        Standard Roofing Estimate (3-Page Letter • Coming Soon)
                      </option>
                      <option value="commercial_roofing_proposal" disabled>
                        Commercial Flat Roof System (Coming Soon)
                      </option>
                      <option value="skylight_estimate" disabled>
                        Skylight &amp; Ventilation Add-on (Coming Soon)
                      </option>
                      <option value="insurance_restoration" disabled>
                        Insurance Restoration &amp; RCV Scope (Coming Soon)
                      </option>
                    </select>
                  </div>

                  {/* 2. Searchable Client Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <User size={13} className="text-amber-500" />
                        <span>Select Client (Search Name, Phone, Email, Address):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManualClient(!isManualClient)}
                        className="text-[10px] font-extrabold text-sky-600 hover:text-sky-800 cursor-pointer"
                      >
                        {isManualClient ? 'Use Searchable Dropdown' : '+ Manual Entry'}
                      </button>
                    </div>

                    {!isManualClient ? (
                      <EstimateClientSearchSelect
                        selectedClientName={proposalData.customerName}
                        onSelectClient={handleSelectClient}
                        onManualEditToggle={() => setIsManualClient(true)}
                      />
                    ) : (
                      /* Manual Client Input Fields */
                      <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
                        <div className="text-[10.5px] font-black text-amber-800 uppercase">
                          Custom / Manual Client Details:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-bold text-slate-600 uppercase">Full Name</label>
                            <input
                              type="text"
                              value={proposalData.customerName}
                              onChange={(e) =>
                                setProposalData((p) => ({ ...p, customerName: e.target.value }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] font-bold text-slate-600 uppercase">Phone Number</label>
                            <input
                              type="text"
                              value={proposalData.customerPhone}
                              onChange={(e) =>
                                setProposalData((p) => ({ ...p, customerPhone: e.target.value }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] font-bold text-slate-600 uppercase">Email Address</label>
                            <input
                              type="email"
                              value={proposalData.customerEmail}
                              onChange={(e) =>
                                setProposalData((p) => ({ ...p, customerEmail: e.target.value }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] font-bold text-slate-600 uppercase">Street Address</label>
                            <input
                              type="text"
                              value={proposalData.customerAddress}
                              onChange={(e) =>
                                setProposalData((p) => ({ ...p, customerAddress: e.target.value }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[9.5px] font-bold text-slate-600 uppercase">City, State &amp; Zip</label>
                            <input
                              type="text"
                              value={proposalData.customerCity}
                              onChange={(e) =>
                                setProposalData((p) => ({ ...p, customerCity: e.target.value }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Proposal Date & Lock-In Validity Period */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1 mb-1">
                        <Clock size={11} className="text-sky-600" />
                        <span>Proposal Date</span>
                      </label>
                      <input
                        type="text"
                        value={proposalData.proposalDate}
                        onChange={(e) =>
                          setProposalData((p) => ({ ...p, proposalDate: e.target.value }))
                        }
                        placeholder="M/D/YYYY"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1 mb-1">
                        <Shield size={11} className="text-amber-500" />
                        <span>Lock-In Validity</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={proposalData.lockInDays || 20}
                          onChange={(e) =>
                            setProposalData((p) => ({
                              ...p,
                              lockInDays: Number(e.target.value) || 20,
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-900"
                        />
                        <span className="text-[11px] font-bold text-slate-500 shrink-0">Days</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Photo 1: Property / Jobsite Photo */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                    <EstimatePhotoUploader
                      photoNumber={1}
                      label="Photo 1: Property / Jobsite Photo"
                      subLabel="Cover Page Hero &amp; Page 2 Top-Right Overview"
                      currentPhotoUrl={proposalData.heroPhotoUrl}
                      onPhotoChange={(url) => setProposalData((p) => ({ ...p, heroPhotoUrl: url }))}
                      presets={PHOTO_1_PRESETS}
                    />
                  </div>

                  {/* 5. Roof Dimensions & Specs (Featured on Cover Specs Card) */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <Home size={12} className="text-sky-600" />
                        <span>Property Roof Dimensions (Cover Specs Card)</span>
                      </span>
                      <span className="text-[10px] font-bold text-sky-700">
                        {proposalData.roofSquares} SQ &bull; {proposalData.roofPitch}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[9.5px] font-black text-slate-600 uppercase">Roof Squares</label>
                        <input
                          type="number"
                          value={proposalData.roofSquares}
                          onChange={(e) => {
                            const sq = Number(e.target.value) || 1;
                            setProposalData((p) => ({ ...p, roofSquares: sq }));
                            setCostInputs((c) => ({ ...c, roofSquares: sq }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-black text-slate-600 uppercase">Roof Pitch</label>
                        <input
                          type="text"
                          value={proposalData.roofPitch}
                          onChange={(e) => setProposalData((p) => ({ ...p, roofPitch: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-black text-slate-600 uppercase">Stories</label>
                        <input
                          type="text"
                          value={proposalData.stories}
                          onChange={(e) => setProposalData((p) => ({ ...p, stories: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2: PAGE 2 (SCOPE, DUAL OPTIONS & MARGIN CALCULATOR)
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Step 2 Header Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Step 2: Dual Options, Scope &amp; Margins
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Option A vs B, Add-ons, and company margin calculator.
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                      <span>Options Preview Active</span>
                      <ArrowRight size={10} />
                    </span>
                  </div>

                  {/* 1. Option A Card Controls */}
                  <div className="p-3.5 rounded-2xl border-2 border-sky-600 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-800 uppercase flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-sky-600 text-white flex items-center justify-center font-black text-[10px]">
                          A
                        </span>
                        <span>Option A: {proposalData.optionA.title}</span>
                      </span>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Lock-In Price</span>
                        <span className="text-sm font-black text-sky-700">
                          ${proposalData.optionA.lockInPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Lock-In Price ($)</label>
                        <input
                          type="number"
                          value={proposalData.optionA.lockInPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setProposalData((p) => ({
                              ...p,
                              optionA: { ...p.optionA, lockInPrice: val, standardPrice: Math.round(val * 1.17) },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Standard Price ($)</label>
                        <input
                          type="number"
                          value={proposalData.optionA.standardPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setProposalData((p) => ({
                              ...p,
                              optionA: { ...p.optionA, standardPrice: val },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Option B Card Controls */}
                  <div className="p-3.5 rounded-2xl border-2 border-sky-600 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-800 uppercase flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-sky-600 text-white flex items-center justify-center font-black text-[10px]">
                          B
                        </span>
                        <span>Option B: {proposalData.optionB.title}</span>
                      </span>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Lock-In Price</span>
                        <span className="text-sm font-black text-sky-700">
                          ${proposalData.optionB.lockInPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Lock-In Price ($)</label>
                        <input
                          type="number"
                          value={proposalData.optionB.lockInPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setProposalData((p) => ({
                              ...p,
                              optionB: { ...p.optionB, lockInPrice: val, standardPrice: Math.round(val * 1.15) },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Standard Price ($)</label>
                        <input
                          type="number"
                          value={proposalData.optionB.standardPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setProposalData((p) => ({
                              ...p,
                              optionB: { ...p.optionB, standardPrice: val },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Add-ons Configuration with Integrated Photo 2 and Photo 3 */}
                  <div className="space-y-3">
                    {/* Add-on 1 Card with Photo 2 */}
                    <div className="p-3.5 rounded-2xl border-2 border-sky-600 bg-white shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-sky-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-sky-600 text-white font-black text-[10px] flex items-center justify-center">
                            1
                          </span>
                          <span>Add-on 1: PSU Underlayment Upgrade</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            value={proposalData.addon1.price}
                            onChange={(e) =>
                              setProposalData((p) => ({
                                ...p,
                                addon1: { ...p.addon1, price: Number(e.target.value) || 0 },
                              }))
                            }
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-black text-sky-700 text-right"
                          />
                        </div>
                      </div>

                      {/* Photo 2 Uploader */}
                      <EstimatePhotoUploader
                        photoNumber={2}
                        label="Photo 2: PSU Underlayment Roll"
                        subLabel="Featured inside Add-on 1 Box on Proposal"
                        currentPhotoUrl={proposalData.addon1.imageUrl || '/images/estimates/underlayment_roll.jpg'}
                        onPhotoChange={(url) =>
                          setProposalData((p) => ({
                            ...p,
                            addon1: { ...p.addon1, imageUrl: url },
                          }))
                        }
                        presets={PHOTO_2_PRESETS}
                        compact={true}
                      />
                    </div>

                    {/* Add-on 2 Card with Photo 3 */}
                    <div className="p-3.5 rounded-2xl border-2 border-sky-600 bg-white shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-sky-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-sky-600 text-white font-black text-[10px] flex items-center justify-center">
                            2
                          </span>
                          <span>Add-on 2: Pressure Washing Soft Wash</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            value={proposalData.addon2.price}
                            onChange={(e) =>
                              setProposalData((p) => ({
                                ...p,
                                addon2: { ...p.addon2, price: Number(e.target.value) || 0 },
                              }))
                            }
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-black text-sky-700 text-right"
                          />
                        </div>
                      </div>

                      {/* Photo 3 Uploader */}
                      <EstimatePhotoUploader
                        photoNumber={3}
                        label="Photo 3: Pressure Washing Equipment"
                        subLabel="Featured inside Add-on 2 Box on Proposal"
                        currentPhotoUrl={proposalData.addon2.imageUrl || '/images/estimates/pressure_washer.jpg'}
                        onPhotoChange={(url) =>
                          setProposalData((p) => ({
                            ...p,
                            addon2: { ...p.addon2, imageUrl: url },
                          }))
                        }
                        presets={PHOTO_3_PRESETS}
                        compact={true}
                      />
                    </div>
                  </div>

                  {/* 4. Collapsible Pricing & Margin Calculator Toggle */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowPricingEngine(!showPricingEngine)}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-500/15"
                    >
                      <span className="flex items-center gap-1.5">
                        <Percent size={13} />
                        <span>{showPricingEngine ? 'Hide Cost Calculator' : 'Open True Cost & Margin Calculator (15%–50%)'}</span>
                      </span>
                      <span className="text-[10px] font-black uppercase">
                        Current Margin: {costInputs.selectedMarginPct}%
                      </span>
                    </button>

                    {showPricingEngine && (
                      <div className="mt-3 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                        <EstimatePricingEngine
                          costInputs={costInputs}
                          onChangeCostInputs={setCostInputs}
                          onApplyToOptionA={handleApplyToOptionA}
                          onApplyToOptionB={handleApplyToOptionB}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3: CENTRALIZED SUMMARY & FINAL ACTIONS HUB
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Step 3 Header Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-amber-600 flex items-center justify-center font-bold">
                        <Award size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Step 3: Executive Summary &amp; Delivery Hub
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Review proposal details, download official PDF, and email homeowner.
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase">
                      <span>Ready to Send</span>
                    </span>
                  </div>

                  {/* 1. Executive Proposal Summary Card */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md border border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                          Client &amp; Property
                        </span>
                        <div className="text-sm font-black uppercase text-white">
                          {proposalData.customerName}
                        </div>
                        <div className="text-xs text-slate-300">
                          {proposalData.customerAddress}, {proposalData.customerCity}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {proposalData.customerPhone} &bull; {proposalData.customerEmail}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider border border-white/20">
                        2-Page Proposal
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-800 text-center">
                      <div className="p-2 rounded-xl bg-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Roof Size</span>
                        <span className="text-xs font-black text-white">
                          {proposalData.roofSquares} SQ ({proposalData.roofPitch})
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Option A Lock-In</span>
                        <span className="text-xs font-black text-sky-400">
                          ${proposalData.optionA.lockInPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Option B Lock-In</span>
                        <span className="text-xs font-black text-amber-300">
                          ${proposalData.optionB.lockInPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] pt-1 text-slate-300">
                      <span>PSU Upgrade: <strong>${proposalData.addon1.price.toLocaleString()}</strong></span>
                      <span>Wash Add-on: <strong>${proposalData.addon2.price.toLocaleString()}</strong></span>
                      <span className="text-emerald-400 font-bold">Margin: {costInputs.selectedMarginPct}%</span>
                    </div>

                    {/* 3-Photo Proposal Media Verification Strip */}
                    <div className="pt-2.5 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-400 mb-1.5">
                        <span>Proposal Media Assets (3/3 Verified):</span>
                        <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Ready for Official PDF &amp; Email
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2">
                          <div className="w-10 h-7 rounded overflow-hidden bg-slate-700 shrink-0">
                            <img src={proposalData.heroPhotoUrl} alt="Photo 1" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9px] font-black text-white truncate">Photo 1</div>
                            <div className="text-[7.5px] text-slate-400 truncate">Property</div>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2">
                          <div className="w-10 h-7 rounded overflow-hidden bg-slate-700 shrink-0">
                            <img src={proposalData.addon1.imageUrl || '/images/estimates/underlayment_roll.jpg'} alt="Photo 2" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9px] font-black text-white truncate">Photo 2</div>
                            <div className="text-[7.5px] text-slate-400 truncate">PSU Roll</div>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2">
                          <div className="w-10 h-7 rounded overflow-hidden bg-slate-700 shrink-0">
                            <img src={proposalData.addon2.imageUrl || '/images/estimates/pressure_washer.jpg'} alt="Photo 3" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9px] font-black text-white truncate">Photo 3</div>
                            <div className="text-[7.5px] text-slate-400 truncate">Power Wash</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Homeowner Delivery & Email (Resend) */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail size={13} className="text-sky-600" />
                        <span>Email Delivery via Resend:</span>
                      </label>
                      <span className="text-[9.5px] font-extrabold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        <span>estimates@riseuprac.com</span>
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Homeowner Recipient Email</label>
                      <input
                        type="email"
                        value={proposalData.customerEmail}
                        onChange={(e) => setProposalData((p) => ({ ...p, customerEmail: e.target.value }))}
                        placeholder="client@example.com"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Email Subject</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Personalized Message</label>
                      <textarea
                        rows={2}
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs resize-none"
                      />
                    </div>
                  </div>

                  {/* 3. Centralized Summary Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Primary CTA 1: Send via Resend Email */}
                      <button
                        type="button"
                        onClick={handleSaveAndSendEmail}
                        disabled={sendingEmail}
                        className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {sendingEmail ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Sending via Resend...</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} className="stroke-[2.5]" />
                            <span>Save Proposal &amp; Send via Email</span>
                          </>
                        )}
                      </button>

                      {/* Primary CTA 2: Download Official PDF */}
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={generatingPdf}
                        className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {generatingPdf ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Compiling 2-Page PDF...</span>
                          </>
                        ) : (
                          <>
                            <FileDown size={14} className="stroke-[2.5] text-amber-400" />
                            <span>Download Official 2-Page PDF</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Secondary CTA: Save to Registry Only */}
                    <button
                      type="button"
                      onClick={handleSaveToRegistry}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Check size={13} />
                      <span>Save to Registry Only (Draft Mode)</span>
                    </button>
                  </div>

                  {/* 4. Live Feedback Status Alerts */}
                  {downloadedPdfUrl && (
                    <div className="p-3 rounded-xl bg-sky-50 text-sky-900 border border-sky-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-sky-600" />
                        <span>Official 2-Page PDF downloaded to your computer</span>
                      </div>
                      <a
                        href={downloadedPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-sky-700 underline"
                      >
                        <ExternalLink size={11} />
                        <span>View PDF</span>
                      </a>
                    </div>
                  )}

                  {emailSentResult && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-bold border animate-in fade-in duration-150 ${
                        emailSentResult.success
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-rose-50 text-rose-900 border-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>{emailSentResult.message}</span>
                      </div>
                      {emailSentResult.emailId && (
                        <div className="text-[10px] text-emerald-700 mt-1">
                          Resend Tracking ID: <code className="font-mono">{emailSentResult.emailId}</code>
                        </div>
                      )}
                      {emailSentResult.pdfUrl && (
                        <a
                          href={
                            emailSentResult.pdfUrl.startsWith('http')
                              ? emailSentResult.pdfUrl
                              : `${API_ORIGIN}${emailSentResult.pdfUrl}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-black text-sky-700 underline mt-1"
                        >
                          <FileDown size={11} />
                          <span>View Attached Official PDF</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bottom Actions Bar */}
            <div className="p-3.5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0">
              {currentStep === 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveToRegistry}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Check size={13} />
                    <span>Save Draft to Registry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(2);
                      setPreviewPage('page2');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                  >
                    <span>Next: Scope &amp; Options (Page 2)</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setPreviewPage('page1');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Cover Setup</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveToRegistry}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Check size={12} />
                      <span className="hidden sm:inline">Save Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                    >
                      <span>Next: Summary &amp; Send</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(2);
                      setPreviewPage('page2');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Scope &amp; Pricing</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndSendEmail}
                    disabled={sendingEmail}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black shadow-lg shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01]"
                  >
                    {sendingEmail ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending via Resend...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} className="stroke-[2.5]" />
                        <span>Send via Resend Email</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: CLEAN 1-PAGE SYNCHRONIZED LIVE PREVIEW (54% width)
              ======================================================== */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col h-full min-h-0">
            <EstimateProposalPreview
              proposalData={proposalData}
              templateKey={selectedTemplate}
              pageView={previewPage}
              onPageViewChange={(page) => setPreviewPage(page)}
              initialZoom={0.70}
            />
          </div>
        </div>
      ) : (
        /* ── PROPOSALS REGISTRY TABLE VIEW ── */
        <div className="space-y-3.5">
          <div className="light-glass-panel rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs border border-white/85">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'all', label: 'All Proposals', count: estimates.length },
                  {
                    id: 'Accepted',
                    label: 'Accepted / Won',
                    count: estimates.filter((e) => e.status === 'Accepted').length,
                  },
                  {
                    id: 'Sent',
                    label: 'Sent & Pending',
                    count: estimates.filter((e) => e.status === 'Sent').length,
                  },
                  {
                    id: 'Draft',
                    label: 'Drafts',
                    count: estimates.filter((e) => e.status === 'Draft').length,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                      statusFilter === f.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setDisplayMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  displayMode === 'table'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  displayMode === 'grid'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          {/* Registry Table */}
          {displayMode === 'table' ? (
            <div className="light-glass-panel rounded-3xl overflow-hidden shadow-xs border border-white/85">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200/80 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Estimate #</th>
                    <th className="px-6 py-3.5">Client &amp; Address</th>
                    <th className="px-6 py-3.5">Dimensions</th>
                    <th className="px-6 py-3.5">Format</th>
                    <th className="px-6 py-3.5">Quoted Total</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">PDF Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEstimates.map((est) => (
                    <tr
                      key={est.id}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-black text-amber-700">{est.estimateNumber}</td>
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                          {est.specs.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {est.specs.streetAddress}, {est.specs.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="font-bold text-slate-900">{est.specs.squares} SQ</span> &bull;{' '}
                        <span>{est.specs.pitch}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-bold">
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200/80 text-[11px]">
                          2-Page Proposal
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 text-sm">
                        $
                        {(
                          est.proposalData?.optionA.lockInPrice || est.tiers.better.total
                        ).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            est.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : est.status === 'Sent'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {est.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (est.proposalData) {
                              setProposalData(est.proposalData);
                            }
                            setViewMode('studio');
                            setCurrentStep(2);
                          }}
                          className="h-7 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <FileDown size={11} />
                          <span>Open in Studio</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredEstimates.map((est) => (
                <div
                  key={est.id}
                  className="light-glass-card rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black text-amber-700">
                        {est.estimateNumber}
                      </span>
                      <h3 className="font-black text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                        {est.specs.customerName}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {est.specs.streetAddress}, {est.specs.city}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        est.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {est.status}
                    </span>
                  </div>

                  <div className="liquid-glass-tile rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Dimensions:</span>
                      <span className="font-bold text-slate-900">
                        {est.specs.squares} SQ &bull; {est.specs.pitch}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Format:</span>
                      <span className="font-bold text-sky-700">2-Page Proposal</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Quoted Total
                      </span>
                      <div className="text-base font-black text-slate-900">
                        $
                        {(
                          est.proposalData?.optionA.lockInPrice || est.tiers.better.total
                        ).toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (est.proposalData) {
                          setProposalData(est.proposalData);
                        }
                        setViewMode('studio');
                        setCurrentStep(2);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <FileDown size={12} />
                      <span>Open in Studio</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
