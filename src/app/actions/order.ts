'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

type CreateOrderParams = {
    customerName: string
    source?: string
    shippingAddress?: string
    deadline?: string
    notes?: string
    items: {
        productId: number
        productName: string
        quantity: number
        widthInch?: number
        heightInch?: number
        fabricCode?: string
        selectedOptions?: string
    }[]
}

export async function createOrder(data: CreateOrderParams) {
    await prisma.order.create({
        data: {
            customerName: data.customerName,
            source: data.source || 'MANUAL',
            shippingAddress: data.shippingAddress,
            deadline: data.deadline ? new Date(data.deadline) : null,
            notes: data.notes,
            status: 'PENDING',
            totalAmount: 0,
            currency: 'USD',
            items: {
                create: data.items.map(item => ({
                    productId: item.productId && item.productId > 0 ? item.productId : null,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: 0,
                    widthInch: item.widthInch || null,
                    heightInch: item.heightInch || null,
                    fabricCode: item.fabricCode,
                    selectedOptions: item.selectedOptions || null,
                }))
            }
        }
    })

    revalidatePath('/orders')
    revalidatePath('/')
}

const STATUS_ORDER = ['PENDING', 'CUTTING', 'COMPLETED', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED'] as const

export async function updateOrderStatus(orderId: number, newStatus: string) {
    // Mevcut siparişi al
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    })

    if (!order) throw new Error('Sipariş bulunamadı.')

    // COMPLETED'a geçerken stoktan düş (sadece ilk kez)
    if (newStatus === 'COMPLETED' && order.status !== 'COMPLETED') {
        await prisma.$transaction(async (tx) => {
            // Siparişin durumunu güncelle
            await tx.order.update({
                where: { id: orderId },
                data: { status: newStatus }
            })

            // Her kalem için kumaş stoktan düş
            for (const item of order.items) {
                if (!item.fabricCode) continue

                // FabricCode ile kumaşı bul (SKU veya Name ile eşle)
                const fabric = await tx.material.findFirst({
                    where: {
                        OR: [
                            { sku: item.fabricCode },
                            { name: item.fabricCode }
                        ],
                        type: 'FABRIC'
                    }
                })

                if (!fabric) continue

                // Tüketim hesabı: boy (inch → metre) × adet
                let consumedMeters = 0
                if (item.heightInch && item.heightInch > 0) {
                    consumedMeters = (item.heightInch * 0.0254) * item.quantity
                }

                if (consumedMeters > 0) {
                    // Stoktan düş
                    await tx.material.update({
                        where: { id: fabric.id },
                        data: { quantity: { decrement: consumedMeters } }
                    })

                    // Hareket kaydı
                    await tx.stockMovement.create({
                        data: {
                            materialId: fabric.id,
                            change: -consumedMeters,
                            type: 'PRODUCTION',
                            reason: `Sipariş #${orderId} - ${item.productName} (${item.quantity} adet)`
                        }
                    })
                }
            }
        })
    } else {
        // Normal durum güncellemesi
        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus }
        })
    }

    revalidatePath('/orders')
    revalidatePath('/inventory')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/')
}

export async function bulkUpdateOrderStatus(orderIds: number[], newStatus: string) {
    // Toplu güncelleme - her birini ayrı ayrı çağır (stok düşme için)
    for (const id of orderIds) {
        await updateOrderStatus(id, newStatus)
    }
}

type UpdateOrderFieldParams = {
    customerName?: string
    source?: string
    notes?: string | null
    deadline?: string | null
    shippingAddress?: string | null
}

export async function updateOrderField(orderId: number, data: UpdateOrderFieldParams) {
    const updateData: Record<string, unknown> = {}

    if (data.customerName !== undefined) updateData.customerName = data.customerName
    if (data.source !== undefined) updateData.source = data.source
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress || null
    if (data.deadline !== undefined) {
        updateData.deadline = data.deadline ? new Date(data.deadline) : null
    }

    await prisma.order.update({
        where: { id: orderId },
        data: updateData
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
}

export async function getOrder(orderId: number) {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    })
}

export async function deleteOrder(orderId: number) {
    await prisma.$transaction(async (tx) => {
        await tx.orderReturn.deleteMany({ where: { orderId } })
        await tx.orderReturn.deleteMany({ where: { reorderId: orderId } })
        await tx.orderItem.deleteMany({ where: { orderId } })
        await tx.order.delete({ where: { id: orderId } })
    })

    revalidatePath('/orders')
    revalidatePath('/returns')
    revalidatePath('/')
}

export async function updateOrderItemOptions(itemId: number, selectedOptions: string | null) {
    const item = await prisma.orderItem.findUnique({
        where: { id: itemId },
        select: { orderId: true }
    })
    if (!item) throw new Error('Sipariş kalemi bulunamadı.')

    await prisma.orderItem.update({
        where: { id: itemId },
        data: { selectedOptions: selectedOptions || null }
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${item.orderId}`)
}

const translationMap: Record<string, string> = {
    'mint': 'MİNT',
    'lilac': 'LİLA',
    'yellow': 'SARI',
    'sage': 'ÇAĞLA',
    'caramel': 'KARAMEL',
    'black': 'SİYAH',
    'ecru': 'EKRU',
    'off white': 'EKRU',
    'off-white': 'EKRU',
    'cream': 'EKRU',
    'beige': 'BEJ',
    'beige 38': 'BEJ',
    'white': 'OPTİK BEYAZ',
    'optik beyaz': 'OPTİK BEYAZ',
    'teal': 'TEAL',
    'cactus': 'KAKTÜS',
    'indigo': 'İNDİGO',
    'orange': 'TURUNCU',
    'mustard': 'HARDAL',
    'cinnamon': 'TARÇIN',
    'salmon': 'SOMON',
    'terracotta': 'TERRA',
    'peach': 'SOMON',
    'rose': 'GÜL KURUSU',
    'pink': 'PEMBE',
    'blue': 'MAVİ',
    'grey': 'GRİ',
    'gray': 'GRİ',
    'cocoa': 'KAKAO',
    'chocolate': 'ÇİKOLATA',
    'brown': 'KAHVE',
    'dusty rose': 'GÜL KURUSU',
    'light grey': 'AÇIK GRİ',
    'dark grey': 'KOYU GRİ'
}

function findBestMaterial(
    itemName: string, 
    variations: string, 
    materials: { sku: string | null, name: string, color: string }[],
    csvSku?: string | null
): string | null {
    // 1. Eğer CSV'de doğrudan bir SKU yazılıysa ve sistemdeki kumaşlardan biriyle eşleşiyorsa direkt onu kullan
    if (csvSku) {
        const cleanedSku = csvSku.trim().toUpperCase()
        const match = materials.find(m => m.sku && m.sku.toUpperCase() === cleanedSku)
        if (match) return match.sku
        
        // Eğer SKU içinde kumaş kodu geçiyorsa (örn SKU: "2KM49-30-45" veya "POP01-PILLOW")
        const matchPartial = materials.find(m => m.sku && cleanedSku.includes(m.sku.toUpperCase()))
        if (matchPartial) return matchPartial.sku
    }

    let prefix = '2KM'
    const nameLower = itemName.toLowerCase()
    if (nameLower.includes('4-ply') || nameLower.includes('4 kat') || nameLower.includes('4-ply')) {
        prefix = '4KM'
    } else if (nameLower.includes('linen') || nameLower.includes('keten')) {
        prefix = 'POP'
    }

    const varsLower = variations.toLowerCase()
    let extractedColor = ''

    const parts = variations.split(',')
    for (const part of parts) {
        const colonIndex = part.indexOf(':')
        if (colonIndex === -1) continue
        const k = part.slice(0, colonIndex).trim().toLowerCase()
        const v = part.slice(colonIndex + 1).trim().toLowerCase()
        if (k.includes('color') || k.includes('colors') || k.includes('choose a color') || k.includes('choos a color')) {
            extractedColor = v
            break
        }
    }

    if (!extractedColor) {
        const pIndex = varsLower.indexOf('personalization:')
        if (pIndex !== -1) {
            const pText = variations.slice(pIndex + 'personalization:'.length).trim()
            const firstLine = pText.split('\n')[0].trim().toLowerCase()
            extractedColor = firstLine.replace(/^[0-9\)\.\-\s]+/g, '').trim()
        }
    }

    if (!extractedColor) return null

    let cleanedColor = extractedColor
        .replace(/^\d+\s*-\s*/, '')
        .replace(/\s*1$/, '')
        .trim()

    let targetTurkishColor = translationMap[cleanedColor]
    if (!targetTurkishColor) {
        for (const [eng, tr] of Object.entries(translationMap)) {
            if (cleanedColor.includes(eng) || eng.includes(cleanedColor)) {
                targetTurkishColor = tr
                break
            }
        }
    }

    const candidateMaterials = materials.filter(m => m.sku && m.sku.startsWith(prefix))

    if (targetTurkishColor) {
        const match = candidateMaterials.find(m => m.color.toUpperCase() === targetTurkishColor.toUpperCase())
        if (match) return match.sku
    }

    const trCleaned = cleanedColor.toUpperCase()
    const matchDirect = candidateMaterials.find(m => m.color.toUpperCase() === trCleaned || m.color.toUpperCase().includes(trCleaned))
    if (matchDirect) return matchDirect.sku

    const matchAny = candidateMaterials.find(m => varsLower.includes(m.color.toLowerCase()))
    if (matchAny) return matchAny.sku

    return candidateMaterials[0]?.sku || null
}

function parseDimensions(variations: string): { width: number | null, height: number | null } {
    const varsLower = variations.toLowerCase()
    let width: number | null = null
    let height: number | null = null

    const xMatch = varsLower.match(/(\d+)\s*x\s*(\d+)/)
    if (xMatch) {
        width = parseInt(xMatch[1])
        height = parseInt(xMatch[2])
        return { width, height }
    }

    const whMatch = varsLower.match(/(\d+)\s*w\b.*?(\d+)\s*h\b/)
    if (whMatch) {
        width = parseInt(whMatch[1])
        height = parseInt(whMatch[2])
        return { width, height }
    }

    const widthHeightMatch = varsLower.match(/width\s*(\d+).*?height\s*(\d+)/)
    if (widthHeightMatch) {
        width = parseInt(widthHeightMatch[1])
        height = parseInt(widthHeightMatch[2])
        return { width, height }
    }

    const wWideMatch = varsLower.match(/(\d+)(?:"|”|inch|inches)?\s*wide/)
    if (wWideMatch) {
        width = parseInt(wWideMatch[1])
    }
    const hLongMatch = varsLower.match(/(\d+)(?:"|”|inch|inches)?\s*(?:long|height|l\b)/)
    if (hLongMatch) {
        height = parseInt(hLongMatch[1])
    }

    return { width, height }
}

export async function importEtsyOrders(csvText: string): Promise<{ success: boolean, count: number, message: string }> {
    try {
        const workbook = XLSX.read(csvText, { type: 'string' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[]

        if (rows.length === 0) {
            return { success: false, count: 0, message: 'Dosya boş veya geçersiz format.' }
        }

        // Fetch all materials to match fabric codes
        const materials = await prisma.material.findMany({
            where: { type: 'FABRIC' },
            select: { id: true, name: true, sku: true, color: true }
        })

        // Group rows by Order ID since the CSV has one row per transaction/item
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ordersMap = new Map<string, any[]>()
        rows.forEach(row => {
            const orderIdStr = String(row['Order ID'] || '').trim()
            if (!orderIdStr) return
            if (!ordersMap.has(orderIdStr)) {
                ordersMap.set(orderIdStr, [])
            }
            ordersMap.get(orderIdStr)!.push(row)
        })

        let importedCount = 0

        // Process each unique Order ID
        for (const [etsyOrderId, itemRows] of ordersMap.entries()) {
            const existing = await prisma.order.findUnique({
                where: { etsyOrderId }
            })
            if (existing) continue // Skip if already imported

            const firstRow = itemRows[0]

            // Parse Date
            const rawDate = firstRow['Sale Date']
            let orderDate = new Date()
            if (rawDate !== undefined && rawDate !== null) {
                if (typeof rawDate === 'number') {
                    // Excel serial date to JS Date
                    const utc_days = Math.floor(rawDate - 25569)
                    const utc_value = utc_days * 86400
                    const date_info = new Date(utc_value * 1000)
                    const fractional_day = rawDate - Math.floor(rawDate) + 0.0000001
                    let total_seconds = Math.floor(86400 * fractional_day)
                    const seconds = total_seconds % 60
                    total_seconds -= seconds
                    const hours = Math.floor(total_seconds / (60 * 60))
                    const minutes = Math.floor(total_seconds / 60) % 60
                    orderDate = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds)
                } else {
                    orderDate = new Date(rawDate)
                }
            }

            const customerName = firstRow['Ship Name'] || firstRow['Buyer'] || 'Etsy Müşterisi'
            
            const addrParts = [
                firstRow['Ship Name'],
                firstRow['Ship Address1'],
                firstRow['Ship Address2'],
                firstRow['Ship City'],
                firstRow['Ship State'],
                firstRow['Ship Zipcode'],
                firstRow['Ship Country']
            ].filter(Boolean).map(s => String(s).trim())
            const shippingAddress = addrParts.join('\n')

            const currency = String(firstRow['Currency'] || 'USD').trim()
            const totalAmount = parseFloat(firstRow['Order Total'] || '0')

            const notesList: string[] = []
            itemRows.forEach(row => {
                const variations = String(row['Variations'] || '')
                const pIndex = variations.toLowerCase().indexOf('personalization:')
                if (pIndex !== -1) {
                    const pText = variations.slice(pIndex + 'personalization:'.length).trim()
                    if (pText) {
                        notesList.push(`${row['Item Name'] || 'Ürün'}: ${pText}`)
                    }
                }
            })
            const notes = notesList.length > 0 ? notesList.join('\n\n') : null

            const items = itemRows.map(row => {
                const itemName = String(row['Item Name'] || '')
                const quantity = parseInt(row['Quantity'] || '1', 10)
                const unitPrice = parseFloat(row['Price'] || '0')
                const variationsStr = String(row['Variations'] || '')

                let productId: number | null = null
                let productName = 'DİĞER'
                const nameLower = itemName.toLowerCase()
                if (nameLower.includes('curtain') || nameLower.includes('curtains')) {
                    productId = 3
                    productName = 'PERDE'
                } else if (nameLower.includes('pillow') || nameLower.includes('cover') || nameLower.includes('covers')) {
                    productId = 4
                    productName = 'YASTIK KILIFI'
                } else if (nameLower.includes('tablecloth')) {
                    productId = 5
                    productName = 'MASA ÖRTÜSÜ'
                } else if (nameLower.includes('fabric')) {
                    productId = 6
                    productName = 'KUMAŞ'
                }

                const csvSku = row['SKU'] ? String(row['SKU']).trim() : null
                const fabricCode = findBestMaterial(itemName, variationsStr, materials, csvSku)
                const { width, height } = parseDimensions(variationsStr)

                let selectedOptions = variationsStr
                const pIndex = selectedOptions.toLowerCase().indexOf(',personalization:')
                if (pIndex !== -1) {
                    selectedOptions = selectedOptions.slice(0, pIndex)
                } else {
                    const pIndex2 = selectedOptions.toLowerCase().indexOf('personalization:')
                    if (pIndex2 !== -1) {
                        selectedOptions = selectedOptions.slice(0, pIndex2)
                    }
                }
                selectedOptions = selectedOptions.replace(/,/g, ', ').trim()

                return {
                    productId,
                    productName,
                    quantity,
                    unitPrice,
                    widthInch: width,
                    heightInch: height,
                    fabricCode,
                    selectedOptions: selectedOptions || null
                }
            })

            await prisma.order.create({
                data: {
                    etsyOrderId,
                    source: 'ETSY',
                    customerName,
                    shippingAddress,
                    totalAmount,
                    currency,
                    notes,
                    status: 'PENDING',
                    orderDate,
                    items: {
                        create: items
                    }
                }
            })

            importedCount++
        }

        revalidatePath('/orders')
        revalidatePath('/')

        return { success: true, count: importedCount, message: `${importedCount} yeni Etsy siparişi başarıyla içeri aktarıldı.` }
    } catch (e) {
        console.error(e)
        return { success: false, count: 0, message: `Hata oluştu: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}` }
    }
}

