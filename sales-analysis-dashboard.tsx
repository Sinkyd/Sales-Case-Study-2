import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, Percent } from 'lucide-react';

const SalesAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const fileContent = await window.fs.readFile('Sales Case Study (2) (1).csv', { encoding: 'utf8' });
        
        const lines = fileContent.trim().split('\n');
        
        const parsed = lines.slice(1).map(line => {
          const values = line.split(',');
          const dateStr = values[0].trim();
          const parts = dateStr.split('/');
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          const date = new Date(year, month - 1, day);
          
          const sales = parseFloat(values[1]);
          const costOfSales = parseFloat(values[2]);
          const quantitySold = parseInt(values[3]);
          
          const unitPrice = sales / quantitySold;
          const grossProfit = sales - costOfSales;
          const grossProfitPercent = (grossProfit / sales) * 100;
          
          return {
            date,
            dateStr,
            sales,
            costOfSales,
            quantitySold,
            unitPrice,
            grossProfit,
            grossProfitPercent
          };
        }).filter(d => !isNaN(d.unitPrice));
        
        parsed.sort((a, b) => a.date - b.date);
        
        parsed.forEach((d, i) => {
          if (i >= 7) {
            const last7 = parsed.slice(i - 7, i);
            const avgPrice7 = last7.reduce((sum, x) => sum + x.unitPrice, 0) / 7;
            const avgQty7 = last7.reduce((sum, x) => sum + x.quantitySold, 0) / 7;
            d.priceChange = ((d.unitPrice - avgPrice7) / avgPrice7) * 100;
            d.qtyChange = ((d.quantitySold - avgQty7) / avgQty7) * 100;
          }
        });
        
        setProcessedData(parsed);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const metrics = useMemo(() => {
    if (!processedData) return null;
    
    const avgUnitPrice = processedData.reduce((sum, d) => sum + d.unitPrice, 0) / processedData.length;
    const avgGrossProfit = processedData.reduce((sum, d) => sum + d.grossProfitPercent, 0) / processedData.length;
    const totalRevenue = processedData.reduce((sum, d) => sum + d.sales, 0);
    const totalQty = processedData.reduce((sum, d) => sum + d.quantitySold, 0);
    
    const minPrice = Math.min(...processedData.map(d => d.unitPrice));
    const maxPrice = Math.max(...processedData.map(d => d.unitPrice));
    
    const promos = processedData.filter(d => d.priceChange && d.priceChange < -3 && d.quantitySold > 5000);
    
    let campaigns = [];
    let current = [];
    promos.forEach((day, i) => {
      if (current.length === 0) {
        current.push(day);
      } else {
        const dayDiff = (day.date - current[current.length - 1].date) / (1000 * 60 * 60 * 24);
        if (dayDiff <= 5) {
          current.push(day);
        } else {
          if (current.length >= 5) campaigns.push([...current]);
          current = [day];
        }
      }
      if (i === promos.length - 1 && current.length >= 5) campaigns.push(current);
    });
    
    const top3Campaigns = campaigns.sort((a, b) => b.length - a.length).slice(0, 3);
    
    const promoDays = top3Campaigns.flat();
    const nonPromoDays = processedData.filter(d => 
      !promoDays.some(p => p.dateStr === d.dateStr) && d.quantitySold > 1000
    );
    
    const promoAvg = {
      price: promoDays.reduce((sum, d) => sum + d.unitPrice, 0) / promoDays.length,
      qty: promoDays.reduce((sum, d) => sum + d.quantitySold, 0) / promoDays.length,
      revenue: promoDays.reduce((sum, d) => sum + d.sales, 0) / promoDays.length,
      gp: promoDays.reduce((sum, d) => sum + d.grossProfitPercent, 0) / promoDays.length
    };
    
    const normalAvg = {
      price: nonPromoDays.reduce((sum, d) => sum + d.unitPrice, 0) / nonPromoDays.length,
      qty: nonPromoDays.reduce((sum, d) => sum + d.quantitySold, 0) / nonPromoDays.length,
      revenue: nonPromoDays.reduce((sum, d) => sum + d.sales, 0) / nonPromoDays.length,
      gp: nonPromoDays.reduce((sum, d) => sum + d.grossProfitPercent, 0) / nonPromoDays.length
    };
    
    return {
      avgUnitPrice,
      avgGrossProfit,
      totalRevenue,
      totalQty,
      minPrice,
      maxPrice,
      recordCount: processedData.length,
      top3Campaigns,
      promoAvg,
      normalAvg
    };
  }, [processedData]);

  const monthlyData = useMemo(() => {
    if (!processedData) return [];
    
    const grouped = {};
    processedData.forEach(d => {
      const key = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(d);
    });
    
    return Object.entries(grouped).map(([month, days]) => ({
      month,
      avgPrice: days.reduce((sum, d) => sum + d.unitPrice, 0) / days.length,
      totalQty: days.reduce((sum, d) => sum + d.quantitySold, 0),
      totalRevenue: days.reduce((sum, d) => sum + d.sales, 0),
      avgGP: days.reduce((sum, d) => sum + d.grossProfitPercent, 0) / days.length
    }));
  }, [processedData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (!processedData || !metrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center text-red-600">
          <p>Error loading data. Please ensure the CSV file is uploaded.</p>
        </div>
      </div>
    );
  }

  const KPICard = (props) => {
    const { title, value, subtitle, icon: Icon, trend } = props;
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`rounded-full p-3 ${trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-blue-100'}`}>
            <Icon className={`w-6 h-6 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <h1 className="text-3xl font-bold">Sales Case Study Analysis</h1>
        <p className="mt-2 text-blue-100">Comprehensive retail product performance analysis (Dec 2013 - Nov 2016)</p>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview & KPIs' },
              { id: 'pricing', label: 'Pricing Analysis' },
              { id: 'promotions', label: 'Promotional Performance' },
              { id: 'trends', label: 'Trends & Insights' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Avg Unit Price"
                value={`R${metrics.avgUnitPrice.toFixed(2)}`}
                subtitle={`Range: R${metrics.minPrice.toFixed(2)} - R${metrics.maxPrice.toFixed(2)}`}
                icon={DollarSign}
              />
              <KPICard
                title="Total Revenue"
                value={`R${(metrics.totalRevenue / 1000000).toFixed(2)}M`}
                subtitle={`${metrics.recordCount} trading days`}
                icon={TrendingUp}
              />
              <KPICard
                title="Total Units Sold"
                value={metrics.totalQty.toLocaleString()}
                subtitle={`Avg: ${Math.round(metrics.totalQty / metrics.recordCount).toLocaleString()}/day`}
                icon={Package}
              />
              <KPICard
                title="Avg Gross Profit"
                value={`${metrics.avgGrossProfit.toFixed(2)}%`}
                subtitle={metrics.avgGrossProfit < 0 ? 'Below cost' : 'Above cost'}
                icon={Percent}
                trend={metrics.avgGrossProfit >= 0 ? 'up' : 'down'}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Key Findings</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>Average daily sales price per unit: <strong>R{metrics.avgUnitPrice.toFixed(2)}</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>Average gross profit margin: <strong>{metrics.avgGrossProfit.toFixed(2)}%</strong> (slightly negative)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>Price range indicates promotional activity throughout period</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>Product shows strong volume response to price reductions</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Recommendations</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Continue promotional strategy - drives 66% revenue increase</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Product is highly elastic (PED -12 to -27) - very price sensitive</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2">⚠</span>
                      <span>Monitor margins during promotions (-7.1% vs -1.2% regular)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Volume gains (+75%) offset margin compression effectively</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="totalRevenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="text-sm text-gray-600">Average Unit Price</p>
                  <p className="text-3xl font-bold text-gray-900">R{metrics.avgUnitPrice.toFixed(2)}</p>
                </div>
                <div className="border-l-4 border-green-600 pl-4">
                  <p className="text-sm text-gray-600">Minimum Price</p>
                  <p className="text-3xl font-bold text-gray-900">R{metrics.minPrice.toFixed(2)}</p>
                </div>
                <div className="border-l-4 border-red-600 pl-4">
                  <p className="text-sm text-gray-600">Maximum Price</p>
                  <p className="text-3xl font-bold text-gray-900">R{metrics.maxPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Price vs Volume Relationship</h2>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="unitPrice" name="Unit Price" label={{ value: 'Unit Price (R)', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="quantitySold" name="Quantity" label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Daily Sales" data={processedData.slice(0, 200)} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-4">
                Clear inverse relationship: Lower prices drive higher volumes, indicating price-elastic demand.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Average Price Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[30, 45]} />
                  <Tooltip formatter={(value) => `R${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="avgPrice" stroke="#8b5cf6" name="Avg Price" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Price Elasticity of Demand Analysis</h2>
              <p className="text-gray-600 mb-6">Analysis of 3 major promotional periods showing demand responsiveness to price changes</p>
              
              <div className="space-y-4">
                {metrics.top3Campaigns.map((campaign, idx) => {
                  const avgPrice = campaign.reduce((sum, d) => sum + d.unitPrice, 0) / campaign.length;
                  const avgQty = campaign.reduce((sum, d) => sum + d.quantitySold, 0) / campaign.length;
                  const avgPriceChg = campaign.reduce((sum, d) => sum + d.priceChange, 0) / campaign.length;
                  const avgQtyChg = campaign.reduce((sum, d) => sum + d.qtyChange, 0) / campaign.length;
                  const ped = avgQtyChg / avgPriceChg;
                  
                  return (
                    <div key={idx} className="border-l-4 border-blue-600 pl-6 py-4 bg-gray-50 rounded-r">
                      <h3 className="font-bold text-lg text-gray-900">Campaign {idx + 1}</h3>
                      <p className="text-sm text-gray-600 mb-3">{campaign[0].dateStr} to {campaign[campaign.length - 1].dateStr} ({campaign.length} days)</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Avg Price</p>
                          <p className="font-semibold">R{avgPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Avg Quantity</p>
                          <p className="font-semibold">{Math.round(avgQty).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Price Change</p>
                          <p className="font-semibold text-red-600">{avgPriceChg.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Quantity Change</p>
                          <p className="font-semibold text-green-600">+{avgQtyChg.toFixed(2)}%</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm font-semibold text-blue-900">Price Elasticity of Demand: {ped.toFixed(2)}</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {Math.abs(ped) > 1 ? '✓ ELASTIC' : '⚠ INELASTIC'} - 
                          {Math.abs(ped) > 1 ? ' Highly responsive to price changes' : ' Less responsive to price changes'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Promotional vs Regular Performance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4">Promotional Days</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-green-700">Avg Unit Price</p>
                      <p className="text-2xl font-bold text-green-900">R{metrics.promoAvg.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Avg Daily Quantity</p>
                      <p className="text-2xl font-bold text-green-900">{Math.round(metrics.promoAvg.qty).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Avg Daily Revenue</p>
                      <p className="text-2xl font-bold text-green-900">R{Math.round(metrics.promoAvg.revenue).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Avg Gross Profit %</p>
                      <p className="text-2xl font-bold text-green-900">{metrics.promoAvg.gp.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Regular Days</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-700">Avg Unit Price</p>
                      <p className="text-2xl font-bold text-gray-900">R{metrics.normalAvg.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Avg Daily Quantity</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.normalAvg.qty).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Avg Daily Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">R{Math.round(metrics.normalAvg.revenue).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Avg Gross Profit %</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.normalAvg.gp.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Impact Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Revenue Change</p>
                    <p className="text-2xl font-bold text-blue-900">
                      +{((metrics.promoAvg.revenue / metrics.normalAvg.revenue - 1) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Volume Change</p>
                    <p className="text-2xl font-bold text-blue-900">
                      +{((metrics.promoAvg.qty / metrics.normalAvg.qty - 1) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Price Change</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {((metrics.promoAvg.price / metrics.normalAvg.price - 1) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-300">
                  <p className="font-semibold text-blue-900 mb-2">Conclusion:</p>
                  <p className="text-sm text-blue-800">
                    ✅ Product performs <strong>BETTER</strong> at promotional prices. Revenue increases by 66% despite 
                    margin compression, as the 75% volume increase more than offsets the price reduction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profitability Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="avgGP" stroke="#10b981" name="Avg GP %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Volume Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                  <Bar dataKey="totalQty" fill="#6366f1" name="Total Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-gray-900">Price Sensitivity</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Product demonstrates high price elasticity with PED values ranging from -12 to -27, indicating 
                    demand is extremely responsive to price changes.
                  </p>
                </div>
                <div className="border-l-4 border-green-600 pl-4">
                  <h3 className="font-semibold text-gray-900">Promotional Effectiveness</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Promotions are highly effective, generating 66% more revenue on average despite lower margins. 
                    The 75% increase in volume more than compensates for the price reduction.
                  </p>
                </div>
                <div className="border-l-4 border-yellow-600 pl-4">
                  <h3 className="font-semibold text-gray-900">Margin Management</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Average gross profit is slightly negative (-0.87%), suggesting cost management needs attention. 
                    Regular pricing barely covers costs, while promotional pricing operates at larger losses offset by volume.
                  </p>
                </div>
                <div className="border-l-4 border-purple-600 pl-4">
                  <h3 className="font-semibold text-gray-900">Strategic Recommendations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    1. Continue aggressive promotional strategy to drive volume and revenue<br />
                    2. Negotiate better supplier terms to improve baseline margins<br />
                    3. Consider loyalty programs to maintain volume at regular prices<br />
                    4. Test price points between promotional and regular to find optimal balance
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Metrics Summary Table</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Metric</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Formula</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Average Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium">Daily Sales Price per Unit</td>
                      <td className="px-4 py-3 text-gray-600">Sales ÷ Quantity Sold</td>
                      <td className="px-4 py-3 font-semibold">R{metrics.avgUnitPrice.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-medium">Daily Gross Profit %</td>
                      <td className="px-4 py-3 text-gray-600">(Sales - Cost) ÷ Sales × 100</td>
                      <td className="px-4 py-3 font-semibold">{metrics.avgGrossProfit.toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Daily Gross Profit % per Unit</td>
                      <td className="px-4 py-3 text-gray-600">Same as Daily GP %</td>
                      <td className="px-4 py-3 font-semibold">{metrics.avgGrossProfit.toFixed(2)}%</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-medium">Average Daily Quantity</td>
                      <td className="px-4 py-3 text-gray-600">Total Qty ÷ Days</td>
                      <td className="px-4 py-3 font-semibold">{Math.round(metrics.totalQty / metrics.recordCount).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Average Daily Revenue</td>
                      <td className="px-4 py-3 text-gray-600">Total Revenue ÷ Days</td>
                      <td className="px-4 py-3 font-semibold">R{Math.round(metrics.totalRevenue / metrics.recordCount).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAnalysisDashboard;