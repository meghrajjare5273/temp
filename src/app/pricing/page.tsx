import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/footer'

export default function Pricing() {
    return (
        <div className='bg-white text-black'>
            <Navbar />
            <section className="py-16 md:py-32 ">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mx-auto max-w-2xl space-y-6 text-center">
                        <h1 className="text-center text-4xl font-semibold lg:text-5xl">Pricing that Scales with You</h1>
                        <p>Gemini is evolving to be more than just the models. It supports an entire to the APIs and platforms helping developers and businesses innovate.</p>
                    </div>

                    <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-medium">Free</CardTitle>
                                <span className="my-3 block text-2xl font-semibold">$0 / mo</span>
                                <CardDescription className="text-sm">Per editor</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <hr className="border-dashed" />

                                <ul className="list-outside space-y-3 text-sm">
                                    {['Data Processing', 'Training Model', 'Extensive Model Testing'].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter className="mt-auto">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="">Get Started</Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="relative">
                            <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">Popular</span>

                            <div className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="font-medium">Pro</CardTitle>
                                    <span className="my-3 block text-2xl font-semibold">$9 / mo</span>
                                    <CardDescription className="text-sm">Per editor</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <hr className="border-dashed" />
                                    <ul className="list-outside space-y-3 text-sm">
                                        {['Data Processing',
                                            'Training Model',
                                            'Extensive Model Testing',
                                            'Hyper-Parameter Tuning',
                                            'Image Data Processing',
                                            'Feature Engineering',
                                            'Cross-Validation',
                                            'Model Deployment',
                                            'Performance Monitoring',
                                            'Data Augmentation',
                                            'Transfer Learning',
                                            'Ensemble Methods',
                                            'Bias Detection & Mitigation',
                                            'A/B Testing'].map((item, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <Check className="size-3" />
                                                    {item}
                                                </li>
                                            ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href="">Get Started</Link>
                                    </Button>
                                </CardFooter>
                            </div>
                        </Card>

                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-medium">Startup</CardTitle>
                                <span className="my-3 block text-2xl font-semibold">$29 / mo</span>
                                <CardDescription className="text-sm">Per editor</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <hr className="border-dashed" />

                                <ul className="list-outside space-y-3 text-sm">
                                    {['Identifying High-ROI Use Cases',
                                        'MVP Feature Selection',
                                        'Rapid Prototyping',
                                        'Cost-effective Cloud Resources',
                                        'Technical Debt Management',
                                        'Compliance & Privacy Planning',
                                        'Build vs. Buy Decisions',
                                        'Scalability Planning',
                                        'User Feedback Loops',
                                        'Investor-friendly Metrics'].map((item, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <Check className="size-3" />
                                                {item}
                                            </li>
                                        ))}
                                </ul>
                            </CardContent>

                            <CardFooter className="mt-auto">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="">Get Started</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    )
}
