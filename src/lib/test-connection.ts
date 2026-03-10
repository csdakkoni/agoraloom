import { prisma } from './prisma'

async function main() {
    try {
        console.log('Testing connection...')
        const count = await prisma.material.count()
        console.log('Connection successful. Material count:', count)
    } catch (error) {
        console.error('Connection failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
