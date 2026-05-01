// Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    // Populate stats
    document.getElementById('total-products').innerText = mockData.products.length;
    document.getElementById('total-orders').innerText = mockData.orders.length;
    
    const activeShipments = mockData.shipments.filter(s => s.status !== 'Delivered').length;
    document.getElementById('active-shipments').innerText = activeShipments;

    const lowStock = mockData.products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
    document.getElementById('low-stock').innerText = lowStock;

    // Populate Recent Orders Table
    const ordersTableBody = document.getElementById('recent-orders-body');
    if (ordersTableBody) {
        // Get last 4 orders
        const recentOrders = mockData.orders.slice(-4).reverse();
        
        recentOrders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order.id}</td>
                <td>${order.retailer}</td>
                <td>${order.date}</td>
                <td>$${order.amount.toFixed(2)}</td>
                <td>${getStatusBadge(order.status)}</td>
            `;
            ordersTableBody.appendChild(tr);
        });
    }
});
