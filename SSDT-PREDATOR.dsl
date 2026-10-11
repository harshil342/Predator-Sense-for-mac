DefinitionBlock ("", "SSDT", 2, "PRED", "PREDATOR", 0x00001000)
{
    /* External declarations from DSDT */
    External (_SB_.PC00.LPCB.EC0, DeviceObj)
    External (_SB_.PC00.LPCB.EC0.CTMP, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.GTMP, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.CPUF, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.GPUF, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.FANT, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.B1CC, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.PL1H, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.PL1L, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.PL2H, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.PL2L, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.KBST, FieldUnitObj)
    External (_SB_.PC00.LPCB.EC0.KBBL, FieldUnitObj)

    Scope (\_SB.PC00.LPCB.EC0)
    {
        /* Read CPU Fan RPM (16-bit) */
        Method (RCPU, 0, Serialized)
        {
            Return (\_SB.PC00.LPCB.EC0.CPUF)
        }

        /* Read GPU Fan RPM (16-bit) */
        Method (RGPU, 0, Serialized)
        {
            Return (\_SB.PC00.LPCB.EC0.GPUF)
        }

        /* Read Both Fan RPMs as a Package */
        Method (RFAN, 0, Serialized)
        {
            Return (Package (0x02)
            {
                \_SB.PC00.LPCB.EC0.CPUF,
                \_SB.PC00.LPCB.EC0.GPUF
            })
        }

        /* Read Temperatures: CPU Temp, GPU Temp in Celsius */
        Method (RTMP, 0, Serialized)
        {
            Return (Package (0x02)
            {
                \_SB.PC00.LPCB.EC0.CTMP,
                \_SB.PC00.LPCB.EC0.GTMP
            })
        }

        /* Set Fan Profile Mode:
           Arg0: 0 = Auto, 1 = Turbo / Max (100%), 2 = Custom
        */
        Method (SFAN, 1, Serialized)
        {
            \_SB.PC00.LPCB.EC0.FANT = Arg0
            Return (One)
        }

        /* Set Battery Charge Limit Threshold (80% battery protection cap):
           Arg0: 0 = 100% (No limit), 1 = 80% (Limit active)
        */
        Method (SBAT, 1, Serialized)
        {
            If ((Arg0 == One))
            {
                \_SB.PC00.LPCB.EC0.B1CC = 0x0050  /* 80% */
            }
            Else
            {
                \_SB.PC00.LPCB.EC0.B1CC = 0x0064  /* 100% */
            }
            Return (\_SB.PC00.LPCB.EC0.B1CC)
        }

        /* Set Predator Performance Profile:
           Arg0:
             0 = Quiet / Silent (PL1: 35W, PL2: 45W, Fan: Auto)
             1 = Balanced / Default (PL1: 55W, PL2: 75W, Fan: Auto)
             2 = Performance / Extreme (PL1: 75W, PL2: 95W, Fan: Auto)
             3 = Turbo (PL1: 95W, PL2: 115W, Fan: Turbo/Max)
        */
        Method (SPER, 1, Serialized)
        {
            If ((Arg0 == Zero))
            {
                /* Quiet: PL1 = 35W, PL2 = 45W */
                \_SB.PC00.LPCB.EC0.PL1L = 0x23
                \_SB.PC00.LPCB.EC0.PL1H = 0x00
                \_SB.PC00.LPCB.EC0.PL2L = 0x2D
                \_SB.PC00.LPCB.EC0.PL2H = 0x00
                \_SB.PC00.LPCB.EC0.FANT = Zero
            }
            ElseIf ((Arg0 == One))
            {
                /* Balanced: PL1 = 55W, PL2 = 75W */
                \_SB.PC00.LPCB.EC0.PL1L = 0x37
                \_SB.PC00.LPCB.EC0.PL1H = 0x00
                \_SB.PC00.LPCB.EC0.PL2L = 0x4B
                \_SB.PC00.LPCB.EC0.PL2H = 0x00
                \_SB.PC00.LPCB.EC0.FANT = Zero
            }
            ElseIf ((Arg0 == 0x02))
            {
                /* Extreme / Performance: PL1 = 75W, PL2 = 95W */
                \_SB.PC00.LPCB.EC0.PL1L = 0x4B
                \_SB.PC00.LPCB.EC0.PL1H = 0x00
                \_SB.PC00.LPCB.EC0.PL2L = 0x5F
                \_SB.PC00.LPCB.EC0.PL2H = 0x00
                \_SB.PC00.LPCB.EC0.FANT = Zero
            }
            ElseIf ((Arg0 == 0x03))
            {
                /* Turbo: PL1 = 95W, PL2 = 115W, Fan = Max */
                \_SB.PC00.LPCB.EC0.PL1L = 0x5F
                \_SB.PC00.LPCB.EC0.PL1H = 0x00
                \_SB.PC00.LPCB.EC0.PL2L = 0x73
                \_SB.PC00.LPCB.EC0.PL2H = 0x00
                \_SB.PC00.LPCB.EC0.FANT = One
            }
            Return (Arg0)
        }
    }

    /* Dedicated PredatorSense Device for easy IORegistry discovery */
    Scope (\_SB)
    {
        Device (PRED)
        {
            Name (_HID, "PRED0001")
            Name (_UID, "PREDATOR")
            Name (_STR, Unicode ("Acer Predator Hardware Control Bridge"))

            Method (_STA, 0, NotSerialized)
            {
                If (_OSI ("Darwin"))
                {
                    Return (0x0F)
                }
                Else
                {
                    Return (Zero)
                }
            }

            /* Proxy methods to EC0 */
            Method (GTMP, 0, Serialized) { Return (\_SB.PC00.LPCB.EC0.RTMP ()) }
            Method (GFAN, 0, Serialized) { Return (\_SB.PC00.LPCB.EC0.RFAN ()) }
            Method (SFAN, 1, Serialized) { Return (\_SB.PC00.LPCB.EC0.SFAN (Arg0)) }
            Method (SBAT, 1, Serialized) { Return (\_SB.PC00.LPCB.EC0.SBAT (Arg0)) }
            Method (SPER, 1, Serialized) { Return (\_SB.PC00.LPCB.EC0.SPER (Arg0)) }
        }
    }
}
