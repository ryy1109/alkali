"use client";
import { Button, Card, Section } from "@ryy1109/web-components";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import ChecklistRounded from "@mui/icons-material/ChecklistRounded";
import InsightsRounded from "@mui/icons-material/InsightsRounded";
import Link from "next/link";
import { SiteHeader } from "./site-header";
export function Landing() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="landing">
        <section className="hero">
          <div>
            <span className="eyebrow">HIGHLY REACTIVE PRODUCTIVITY</span>
            <h1>
              A little structure.
              <br />
              <span>A lot more clarity.</span>
            </h1>
            <p>
              Bring your subjects, study tasks, and deadlines into focus. Make
              space for learning, one small step at a time.
            </p>
            <div className="inline-actions">
              <Button
                href="/signup"
                label="Find your flow"
                variant="Primary"
                size="Large"
                endIcon={<ArrowForwardRounded />}
              />
              <Link href="/login">I already have an account</Link>
            </div>
            <p className="hero-caption">
              Your next chapter starts with a plan.
            </p>
          </div>
          <div className="hero-illustration" aria-hidden="true">
            <div className="illustration-orbit" />
            <div className="paper-card">
              <span className="paper-eyebrow">A FRESH PERSPECTIVE</span>
              <strong>
                Less scattered.
                <br />
                More focused.
              </strong>
              <div className="paper-line" />
              <div className="paper-line short" />
              <div className="mint-stamp">✓</div>
              <span className="paper-footer">Make progress feel possible.</span>
            </div>
            <span className="floating-label">Room to grow ✦</span>
          </div>
        </section>
        <Section
          title="Everything has its place."
          description="A thoughtful workspace for your student life."
          spacing="large"
        >
          <div className="feature-grid">
            <Card
              variant="outlined"
              content={
                <>
                  <span className="feature-icon">
                    <MenuBookRounded />
                  </span>
                  <h3>Keep subjects together</h3>
                  <p>
                    Give every class a home, with its study tasks close at hand.
                  </p>
                </>
              }
            />
            <Card
              variant="outlined"
              content={
                <>
                  <span className="feature-icon mint">
                    <ChecklistRounded />
                  </span>
                  <h3>Know your next step</h3>
                  <p>
                    Set priorities and due dates, then work through your plan.
                  </p>
                </>
              }
            />
            <Card
              variant="outlined"
              content={
                <>
                  <span className="feature-icon">
                    <InsightsRounded />
                  </span>
                  <h3>See your progress</h3>
                  <p>
                    Find upcoming deadlines and celebrate the work you finish.
                  </p>
                </>
              }
            />
          </div>
        </Section>
      </main>
      <footer className="site-footer">
        <span>Alkali · Highly reactive productivity.</span>
        <Link href="/privacy">Privacy Policy</Link>
      </footer>
    </>
  );
}
