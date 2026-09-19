$body = @{
    customerName = 'David Martinez'
    customerPhone = '(760) 555-0199'
    customerAddress = '742 Evergreen Terrace'
    customerCity = 'Escondido, CA'
    roofSquares = 25
    roofPitch = '4:12'
    stories = 1
    templateKey = 'multi_option_proposal'
    proposalData = @{
        proposal_date = '08/27/2026'
        customer_name = 'David Martinez'
        option_a = @{
            lock_in_price = 26870
        }
    }
    total = 26870
    marginPct = 30
} | ConvertTo-Json -Depth 5

$headers = @{
    'Content-Type' = 'application/json'
    'X-API-Key' = 'rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw'
}

$response = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/admin/estimates' -Method Post -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 3
