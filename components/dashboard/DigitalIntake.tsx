
import React, { useState, useEffect } from 'react';
import { ArrowRightIcon } from '../../constants';

interface DigitalIntakeProps {
    onComplete: (data: any) => void;
    onProgress?: (progress: number) => void;
    initialSection?: IntakeSection;
}

// --- Data Definitions ---

const phq9Questions = [
    "Over the last 2 weeks, how often have you found little pleasure or interest in doing things you usually enjoy?",
    "How often have you felt down, depressed, or hopeless about the future?",
    "Have you had trouble falling asleep, staying asleep, or found yourself sleeping too much?",
    "How often have you felt tired or had little energy to get through the day?",
    "Have you experienced a poor appetite or found yourself overeating?",
    "Have you felt bad about yourself — or that you are a failure or have let yourself or your family down?",
    "Have you had trouble concentrating on things, such as reading the newspaper or watching television?",
    "Have you moved or spoken so slowly that other people could have noticed? Or the opposite — being so fidgety or restless?",
    "Have you had thoughts that you would be better off dead or of hurting yourself in some way?"
];

const besQuestions = [
    {
        id: 1,
        label: "Appearance Insecurity",
        options: [
            { score: 0, text: "I don't feel self-conscious about my weight or body size when I'm with others." },
            { score: 0, text: "I feel concerned about how I look to others, but it normally doesn't make me feel disappointed with myself." },
            { score: 1, text: "I do get self-conscious about my appearance and weight which makes me feel disappointed in myself." },
            { score: 3, text: "I feel very self-conscious about my weight and frequently, I feel like I'm just failing at everything." }
        ]
    },
    {
        id: 2,
        label: "Eating Speed",
        options: [
            { score: 0, text: "I don't have any difficulty eating slowly in the proper manner." },
            { score: 1, text: "Although I seem to devour foods, I don't end up feeling stuffed because of eating too much." },
            { score: 2, text: "At times, I tend to eat quickly and then, I feel uncomfortably full afterwards." },
            { score: 3, text: "I have the habit of bolting down my food, without really chewing it. When this happens I usually feel uncomfortably stuffed because I've eaten too much." }
        ]
    },
    {
        id: 3,
        label: "Control over Urges",
        options: [
            { score: 0, text: "I feel capable to control my eating urges when I want to." },
            { score: 1, text: "I feel like I have failed to control my eating more than the average person." },
            { score: 3, text: "I feel utterly helpless when it comes to controlling my eating urges." },
            { score: 3, text: "Because I feel so helpless about controlling my eating I have become very desperate about trying to get in control." }
        ]
    },
    {
        id: 4,
        label: "Emotional Eating (Boredom)",
        options: [
            { score: 0, text: "I don't have the habit of eating when I'm bored." },
            { score: 0, text: "I sometimes eat when I'm bored, but often I'm able to get busy and get my mind off food." },
            { score: 0, text: "I have a regular habit of eating when I'm bored, but occasionally, I can use some other activity to get my mind off it." },
            { score: 2, text: "I have a strong habit of eating when I'm bored. Nothing seems to help me break the habit." }
        ]
    },
    {
        id: 5,
        label: "Physical vs Mental Hunger",
        options: [
            { score: 0, text: "I'm usually physically hungry when I eat something." },
            { score: 1, text: "Occasionally, I eat something on impulse even though I'm not really hungry." },
            { score: 2, text: "I have the regular habit of eating foods, that I might not really enjoy, to satisfy a hungry feeling even though physically, I don't need the food." },
            { score: 3, text: "Even though I'm not physically hungry, I get a hungry feeling in my mouth that only seems to be satisfied when I eat a food." }
        ]
    },
    {
        id: 6,
        label: "Post-Eating Guilt",
        options: [
            { score: 0, text: "I don't feel any guilt or self-hate after I overeat." },
            { score: 1, text: "After I overeat, occasionally I feel guilt or self-hate." },
            { score: 3, text: "Almost all the time I experience strong guilt or self-hate after I overeat." }
        ]
    },
    {
        id: 7,
        label: "Dietary Compliance",
        options: [
            { score: 0, text: "I don't lose total control of my eating when dieting even after periods when I overeat." },
            { score: 2, text: "Sometimes when I eat a \"forbidden food\" on a diet, I feel like I blew it and eat even more." },
            { score: 3, text: "Frequently, I have the habit of saying to myself, \"I've blown it now, why not go all the way\" when I overeat on a diet." }
        ]
    },
    {
        id: 8,
        label: "Satiety Awareness",
        options: [
            { score: 0, text: "I rarely eat so much food that I feel uncomfortably stuffed afterwards." },
            { score: 1, text: "Usually about once a month, I eat such a quantity of food, I end up feeling very stuffed." },
            { score: 2, text: "I have regular periods during the month when I eat large amounts of food, either at mealtime or at snacks." },
            { score: 3, text: "I eat so much food that I regularly feel quite uncomfortable after eating." }
        ]
    }
];

const eat26Questions = [
    "I feel an intense, overwhelming fear about the idea of being overweight.",
    "I actively ignore hunger signals and avoid eating even when my body physically needs food.",
    "I find myself constantly preoccupied with thoughts about food.",
    "I have gone on eating binges where I feel that I may not be able to stop.",
    "I cut my food into small pieces to make it last longer or seem like more.",
    "I am acutely aware of the calorie content of every food that I eat.",
    "I particularly avoid foods with a high carbohydrate content (e.g., bread, rice, potatoes).",
    "I feel that others would prefer if I ate more than I do.",
    "I vomit after I have eaten to control my weight.",
    "I feel extremely guilty after eating.",
    "I am preoccupied with a desire to be thinner.",
    "I think about burning up calories when I exercise.",
    "Other people think that I am too thin.",
    "I am preoccupied with the thought of having fat on my body.",
    "I take longer than others to eat my meals.",
    "I avoid foods with sugar in them.",
    "I eat diet foods.",
    "I feel that food controls my life.",
    "I display self-control around food.",
    "I feel that others pressure me to eat.",
    "I give too much time and thought to food.",
    "I feel uncomfortable after eating sweets.",
    "I engage in dieting behavior.",
    "I like my stomach to be empty.",
    "I enjoy trying new rich foods.",
    "I have the impulse to vomit after meals."
];

type IntakeSection = 'intro' | 'vitals' | 'objectives' | 'medical' | 'family' | 'contraindications' | 'phq9' | 'bes' | 'eat26';

const DigitalIntake: React.FC<DigitalIntakeProps> = ({ onComplete, onProgress, initialSection = 'intro' }) => {
    const [section, setSection] = useState<IntakeSection>(initialSection);
    const [formData, setFormData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Sequence of steps in the intake process
    const steps: IntakeSection[] = ['intro', 'vitals', 'objectives', 'medical', 'family', 'contraindications', 'phq9', 'bes', 'eat26'];

    useEffect(() => {
        if (onProgress) {
            const currentIndex = steps.indexOf(section);
            // Calculate percentage based on step index (0 to length-1)
            // 'intro' is 0%, 'eat26' is near 100%
            const percent = Math.round((currentIndex / (steps.length - 1)) * 100);
            onProgress(percent);
        }
    }, [section, onProgress]);

    const handleNextStep = () => {
        const currentIndex = steps.indexOf(section);
        if (currentIndex < steps.length - 1) {
            setSection(steps[currentIndex + 1]);
            setCurrentQuestionIndex(0); // Reset for new section
            window.scrollTo(0, 0);
        } else {
            handleFinish();
        }
    };

    const handlePrevStep = () => {
        const currentIndex = steps.indexOf(section);
        if (currentIndex > 0) {
            setSection(steps[currentIndex - 1]);
            setCurrentQuestionIndex(0);
            window.scrollTo(0, 0);
        }
    };

    const handleFinish = () => {
        if (onProgress) onProgress(100);
        setIsSubmitting(true);
        setTimeout(() => {
            onComplete(formData);
        }, 2000);
    };

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    // Helper to render simple input questions
    const renderQuestion = (label: string, key: string, type: 'text' | 'yesno' | 'select' | 'scale' | 'textarea', options?: string[]) => {
        return (
            <div className="mb-6 animate-fade-in">
                <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>

                {type === 'text' && (
                    <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                        placeholder="Type here..."
                        onChange={(e) => handleChange(key, e.target.value)}
                        value={formData[key] || ''}
                    />
                )}

                {type === 'textarea' && (
                    <textarea
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all min-h-[100px]"
                        placeholder="Please describe..."
                        onChange={(e) => handleChange(key, e.target.value)}
                        value={formData[key] || ''}
                    />
                )}

                {type === 'yesno' && (
                    <div className="flex gap-4">
                        {['Yes', 'No'].map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleChange(key, opt)}
                                className={`flex-1 py-3 rounded-xl border font-semibold transition-all ${formData[key] === opt ? 'bg-brand-purple text-white border-brand-purple' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {type === 'select' && options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleChange(key, opt)}
                                className={`py-3 px-4 rounded-xl border text-left font-medium transition-all ${formData[key] === opt ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // --- Render Sections ---

    const renderIntro = () => (
        <div className="text-center animate-fade-in">
            <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">Medical Intake</h2>
            <p className="mt-4 text-lg text-brand-text-light max-w-2xl mx-auto">
                To build your metabolic fingerprint, we need to understand your physiology, history, and relationship with food.
            </p>
            <div className="mt-8 space-y-4 max-w-md mx-auto text-left">
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center gap-4">
                    <span className="text-2xl">📊</span>
                    <div><h4 className="font-bold">Vitals & Objectives</h4><p className="text-xs text-gray-500">Baselines and goals</p></div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center gap-4">
                    <span className="text-2xl">🧬</span>
                    <div><h4 className="font-bold">Medical History</h4><p className="text-xs text-gray-500">Family history & safety check</p></div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center gap-4">
                    <span className="text-2xl">🧠</span>
                    <div><h4 className="font-bold">Psychometrics</h4><p className="text-xs text-gray-500">PHQ-9, BES, EAT-26</p></div>
                </div>
            </div>
            <button
                onClick={handleNextStep}
                className="mt-10 px-8 py-4 text-lg font-bold text-white bg-brand-purple rounded-full shadow-lg hover:bg-brand-purple/90 transition-transform hover:scale-105"
            >
                Start Assessment
            </button>
            <div className="mt-6">
                <button
                    onClick={() => onComplete({})}
                    className="text-brand-purple/60 hover:text-brand-purple text-sm font-medium transition-colors cursor-pointer"
                >
                    Allow me to demo all the sections without filling in the information
                </button>
            </div>
        </div>
    );

    const renderVitals = () => (
        <div className="max-w-xl mx-auto animate-fade-in">
            <h3 className="text-2xl font-bold text-brand-text mb-2 text-center">Vitals & Measurements</h3>
            <p className="text-gray-500 mb-8 text-center">Let's establish your baseline metrics.</p>

            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">

                {/* Age */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Age</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.age || ''}
                            onChange={(e) => handleChange('age', e.target.value)}
                            className="block w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-900 py-4 px-4 text-lg focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all outline-none"
                            placeholder="32"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <span className="text-gray-500 font-semibold">years</span>
                        </div>
                    </div>
                </div>

                {/* Height */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Height</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.height_ft || ''}
                                onChange={(e) => handleChange('height_ft', e.target.value)}
                                className="block w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-900 py-4 px-4 text-lg focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all outline-none"
                                placeholder="5"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                <span className="text-gray-500 font-semibold">ft</span>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.height_in || ''}
                                onChange={(e) => handleChange('height_in', e.target.value)}
                                className="block w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-900 py-4 px-4 text-lg focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all outline-none"
                                placeholder="8"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                <span className="text-gray-500 font-semibold">in</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weight */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Current Weight</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.current_weight || ''}
                            onChange={(e) => handleChange('current_weight', e.target.value)}
                            className="block w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-900 py-4 px-4 text-lg focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all outline-none"
                            placeholder="75"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <span className="text-gray-500 font-semibold">kg</span>
                        </div>
                    </div>
                </div>

                {/* Waist */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Waist Circumference <span className="font-normal text-gray-400 text-xs ml-1">(at belly button)</span></label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.waist || ''}
                            onChange={(e) => handleChange('waist', e.target.value)}
                            className="block w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-900 py-4 px-4 text-lg focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all outline-none"
                            placeholder="32"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <span className="text-gray-500 font-semibold">in</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Heart Rate */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Resting Heart Rate <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.heart_rate || ''}
                                onChange={(e) => handleChange('heart_rate', e.target.value)}
                                className="block w-full rounded-xl border border-gray-300 bg-white text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all outline-none"
                                placeholder="72"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                <span className="text-gray-400 text-xs">bpm</span>
                            </div>
                        </div>
                    </div>

                    {/* BP */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Blood Pressure <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                        <input
                            type="text"
                            value={formData.bp || ''}
                            onChange={(e) => handleChange('bp', e.target.value)}
                            className="block w-full rounded-xl border border-gray-300 bg-white text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all outline-none"
                            placeholder="120/80"
                        />
                    </div>
                </div>

            </div>

            <div className="flex justify-between mt-8 pt-6">
                <button onClick={handlePrevStep} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Back</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 px-8 py-3 bg-brand-text text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">Next <ArrowRightIcon /></button>
            </div>
        </div>
    );

    const renderObjectives = () => (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-2xl font-bold text-brand-text mb-2">Objectives</h3>
            <p className="text-gray-500 mb-6">What does success look like to you?</p>

            <div className="space-y-2">
                {renderQuestion("Goal Weight (kg)", "goal_weight", "text")}
                {renderQuestion("Primary Motivation", "motivation", "select", ["Health / Longevity", "Appearance / Confidence", "Energy / Mobility", "Doctor Recommendation"])}
                {renderQuestion("How committed are you to lifestyle changes?", "commitment", "select", ["Very Committed", "Somewhat Committed", "I need help with this"])}
                {renderQuestion("Have you tried GLP-1 medications before?", "prev_glp1", "yesno")}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button onClick={handlePrevStep} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700">Back</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 px-8 py-3 bg-brand-text text-white rounded-xl font-bold hover:bg-gray-800">Next <ArrowRightIcon /></button>
            </div>
        </div>
    );

    const renderMedical = () => (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-2xl font-bold text-brand-text mb-2">Medical History</h3>
            <p className="text-gray-500 mb-6">Your health background helps us ensure safety.</p>

            <div className="space-y-2">
                {renderQuestion("Have you ever been professionally diagnosed with Type 2 Diabetes or Pre-diabetes?", "t2d", "yesno")}
                {renderQuestion("Do you manage High Blood Pressure with medication?", "hypertension", "yesno")}
                {renderQuestion("Have you been diagnosed with PCOS or do you experience irregular menstrual cycles?", "pcos", "yesno")}
                {renderQuestion("Do you use a CPAP machine or have a diagnosis of Sleep Apnea?", "sleep_apnea", "yesno")}
                {renderQuestion("Please list all prescription medications, vitamins, and supplements you take.", "medications", "textarea")}
                {renderQuestion("Please describe any other chronic medical conditions (e.g. Thyroid issues, Kidney disease, etc.)", "other_conditions", "textarea")}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button onClick={handlePrevStep} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700">Back</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 px-8 py-3 bg-brand-text text-white rounded-xl font-bold hover:bg-gray-800">Next <ArrowRightIcon /></button>
            </div>
        </div>
    );

    const renderFamily = () => (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-2xl font-bold text-brand-text mb-2">Family History</h3>
            <p className="text-gray-500 mb-6">Understanding your genetic predispositions.</p>

            <div className="space-y-2">
                {renderQuestion("Do any immediate family members struggle with severe obesity?", "family_obesity", "yesno")}
                {renderQuestion("Does any immediate family member (parent/sibling) have Type 2 Diabetes?", "family_diabetes", "yesno")}
                {renderQuestion("Has anyone in your family suffered a heart attack or stroke before age 50?", "family_cardio", "yesno")}
                {renderQuestion("Is there a family history of thyroid cancer?", "family_thyroid", "yesno")}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button onClick={handlePrevStep} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700">Back</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 px-8 py-3 bg-brand-text text-white rounded-xl font-bold hover:bg-gray-800">Next <ArrowRightIcon /></button>
            </div>
        </div>
    );

    const renderContraindications = () => (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-2xl font-bold text-brand-text mb-2">Safety Screen</h3>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                <p className="text-sm text-red-800 font-medium">These questions are critical for your safety with GLP-1 medications.</p>
            </div>

            <div className="space-y-2">
                {renderQuestion("Personal or family history of Medullary Thyroid Carcinoma (MTC)?", "contra_mtc", "yesno")}
                {renderQuestion("Do you have Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)?", "contra_men2", "yesno")}
                {renderQuestion("Have you ever been hospitalized for Pancreatitis (inflammation of the pancreas)?", "contra_pancreatitis", "yesno")}
                {renderQuestion("Are you currently pregnant, breastfeeding, or actively trying to conceive?", "contra_pregnancy", "yesno")}
                {renderQuestion("Do you have a history of suicidal thoughts or attempts?", "contra_suicide", "yesno")}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button onClick={handlePrevStep} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700">Back</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 px-8 py-3 bg-brand-text text-white rounded-xl font-bold hover:bg-gray-800">Next <ArrowRightIcon /></button>
            </div>
        </div>
    );

    const renderPhq9 = () => (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-brand-text">PHQ-9: Mood Assessment</h3>
                <p className="text-sm text-gray-500 mb-4">Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div
                        className="bg-brand-purple h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex) / phq9Questions.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                <p className="text-lg font-medium text-gray-900 mb-6">{phq9Questions[currentQuestionIndex]}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Not at all (0 days)', 'Several days (2-6 days)', 'More than half (7-11 days)', 'Nearly every day (12-14 days)'].map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                if (currentQuestionIndex < phq9Questions.length - 1) {
                                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                                } else {
                                    handleNextStep();
                                }
                            }}
                            className="p-4 text-left border border-gray-200 rounded-xl hover:bg-brand-purple/5 hover:border-brand-purple transition-colors font-medium text-gray-700"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center">
                <button onClick={handlePrevStep} className="text-gray-400 hover:text-gray-600 text-sm font-semibold">Skip back to history</button>
            </div>
        </div>
    );

    const renderBes = () => (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-brand-text">Binge Eating Scale (BES)</h3>
                <p className="text-sm text-gray-500 mb-4">Select the statement that best describes you.</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div
                        className="bg-brand-purple h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex) / besQuestions.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                <p className="text-[10px] font-black uppercase text-brand-pink tracking-widest mb-2 opacity-70">
                    {besQuestions[currentQuestionIndex].label}
                </p>
                <div className="space-y-3">
                    {besQuestions[currentQuestionIndex].options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (currentQuestionIndex < besQuestions.length - 1) {
                                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                                } else {
                                    handleNextStep();
                                }
                            }}
                            className="w-full p-4 text-left border border-gray-200 rounded-xl hover:bg-brand-purple/5 hover:border-brand-purple transition-colors font-medium text-gray-700 text-sm"
                        >
                            {option.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderEat26 = () => (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-brand-text">EAT-26 Screening</h3>
                <p className="text-sm text-gray-500 mb-4">Select the frequency that applies to you.</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div
                        className="bg-brand-purple h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex) / eat26Questions.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                <p className="text-lg font-medium text-gray-900 mb-6">{eat26Questions[currentQuestionIndex]}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['Always', 'Usually', 'Often', 'Sometimes', 'Rarely', 'Never'].map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                if (currentQuestionIndex < eat26Questions.length - 1) {
                                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                                } else {
                                    handleNextStep();
                                }
                            }}
                            className="p-3 text-center border border-gray-200 rounded-xl hover:bg-brand-purple/5 hover:border-brand-purple transition-colors font-medium text-gray-700 text-sm"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    if (isSubmitting) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-[400px]">
                <svg className="animate-spin h-12 w-12 text-brand-purple mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <h2 className="text-2xl font-bold text-brand-text">Processing Intake...</h2>
                <p className="text-brand-text-light mt-2">Compiling your Metabolic Fingerprint.</p>
            </div>
        )
    }

    switch (section) {
        case 'intro': return renderIntro();
        case 'vitals': return renderVitals();
        case 'objectives': return renderObjectives();
        case 'medical': return renderMedical();
        case 'family': return renderFamily();
        case 'contraindications': return renderContraindications();
        case 'phq9': return renderPhq9();
        case 'bes': return renderBes();
        case 'eat26': return renderEat26();
        default: return null;
    }
};

export default DigitalIntake;
