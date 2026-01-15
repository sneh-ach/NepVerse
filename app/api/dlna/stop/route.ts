import { NextRequest, NextResponse } from 'next/server'

// DLNA stop casting endpoint

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json(
        { message: 'deviceId is required' },
        { status: 400 }
      )
    }

    // TODO: Implement DLNA stop
    // await device.call('urn:schemas-upnp-org:service:AVTransport:1', 'Stop', {
    //   InstanceID: 0
    // })

    return NextResponse.json({ message: 'Casting stopped' })
  } catch (error) {
    console.error('DLNA stop error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


