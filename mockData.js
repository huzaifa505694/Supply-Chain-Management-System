const mockData = {
    products: [
        { id: 'PRD-001', name: 'Industrial Processor X-1', price: 1200.50, stock: 450, warehouse: 'WH-01', status: 'In Stock' },
        { id: 'PRD-002', name: 'Server Rack 42U', price: 450.00, stock: 12, warehouse: 'WH-02', status: 'Low Stock' },
        { id: 'PRD-003', name: 'Cooling Unit 5000', price: 850.00, stock: 0, warehouse: 'WH-01', status: 'Out of Stock' },
        { id: 'PRD-004', name: 'Gigabit Switch 48-Port', price: 299.99, stock: 120, warehouse: 'WH-02', status: 'In Stock' },
        { id: 'PRD-005', name: 'Fiber Optic Cable 100m', price: 120.00, stock: 55, warehouse: 'WH-03', status: 'In Stock' }
    ],
    orders: [
        { id: 'ORD-1024', date: '2026-04-28', retailer: 'TechCorp Solutions', amount: 14500.00, items: 15, status: 'Processing' },
        { id: 'ORD-1025', date: '2026-04-29', retailer: 'DataCenter Systems', amount: 3200.50, items: 4, status: 'Shipped' },
        { id: 'ORD-1026', date: '2026-04-30', retailer: 'Global Networks', amount: 850.00, items: 1, status: 'Pending' },
        { id: 'ORD-1027', date: '2026-05-01', retailer: 'TechCorp Solutions', amount: 2400.00, items: 2, status: 'Delivered' }
    ],
    shipments: [
        { id: 'SHP-8821', tracking: 'TRK-9001234', date: '2026-04-30', orderId: 'ORD-1025', type: 'Overnight', status: 'In Transit' },
        { id: 'SHP-8822', tracking: 'TRK-9001235', date: '2026-05-02', orderId: 'ORD-1026', type: 'Day', status: 'Preparing' },
        { id: 'SHP-8823', tracking: 'TRK-9001236', date: '2026-04-28', orderId: 'ORD-1027', type: 'Overnight', status: 'Delivered' }
    ],
    warehouses: [
        { id: 'WH-01', name: 'North Central Hub', location: 'Chicago, IL', manager: 'Alice Smith', type: 'General', capacity: '75%' },
        { id: 'WH-02', name: 'East Coast Storage', location: 'New York, NY', manager: 'Bob Johnson', type: 'General', capacity: '90%' },
        { id: 'WH-03', name: 'West Cold Storage', location: 'Seattle, WA', manager: 'Carol Davis', type: 'Cold', capacity: '40%' }
    ],
    partners: [
        { id: 'SUP-01', name: 'Intellect Components', type: 'Supplier', country: 'USA', email: 'sales@intellect.com' },
        { id: 'RET-01', name: 'TechCorp Solutions', type: 'Retailer', country: 'Canada', email: 'procurement@techcorp.ca' },
        { id: 'LOG-01', name: 'FastTrack Freight', type: 'Logistics', country: 'USA', email: 'dispatch@fasttrack.com' }
    ]
};
